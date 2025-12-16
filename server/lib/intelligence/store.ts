import { promises as fs } from 'fs';
import path from 'path';

export interface StoredFeedItem {
  id: string;
  url: string;
  title: string;
  source: string;
  kind: string;
  publishedAt: string;
  summary: string;
  firstSeenAt: string;
}

export interface StoredDigest {
  generatedAt: string;
  persona: string;
  markdown: string;
  sourceIds: string[];
}

interface StoreEntry {
  lastSeenAt?: string;
  lastFetchedAt?: string;
  items: StoredFeedItem[];
  processedItems?: any[]; // Phase 3: Sonny per-item outputs (validated upstream)
  digest?: StoredDigest;  // Phase 3: Latest digest for this entryKey
}

interface IntelligenceStore {
  version: 4;
  entries: Record<string, StoreEntry>;
  jobs?: Record<string, IntelligenceJob>;
}

const STORE_VERSION: IntelligenceStore['version'] = 4;
const MAX_ITEMS_PER_ENTRY = 500;
const STORE_PATH = path.resolve(process.cwd(), 'server', 'data', 'intelligence-store.json');

export type IntelligenceJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface IntelligenceJob {
  id: string;
  entryKey: string;
  type: 'digest';
  status: IntelligenceJobStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  progress?: number; // 0..1 best effort
  message?: string;
  error?: string;
  heartbeatAt?: string;
  payload?: any;
}

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = '';
    u.hostname = u.hostname.toLowerCase();

    // Strip common tracking params
    const drop = new Set([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'gclid',
      'fbclid',
      'mc_cid',
      'mc_eid',
      'ref',
      'source',
    ]);

    for (const k of Array.from(u.searchParams.keys())) {
      if (drop.has(k.toLowerCase())) u.searchParams.delete(k);
    }

    // Sort remaining params for stable identity
    const params = Array.from(u.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
    u.search = '';
    for (const [k, v] of params) u.searchParams.append(k, v);
    return u.toString();
  } catch {
    return raw.trim();
  }
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJsonFileAtomic(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // IMPORTANT: Use a unique tmp path per write.
  // A fixed `${filePath}.tmp` can race under concurrent writers (multiple jobs / runner),
  // leading to ENOENT during rename when another writer already moved the tmp file.
  const tmp = `${filePath}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmp, filePath);
}

export async function loadStore(): Promise<IntelligenceStore> {
  const existingAny = await readJsonFile<any>(STORE_PATH);
  if (!existingAny || !existingAny.entries) return { version: STORE_VERSION, entries: {} };

  // Migrate v1 -> v2 in-memory
  if (existingAny.version === 1) {
    const migrated: IntelligenceStore = { version: STORE_VERSION, entries: existingAny.entries, jobs: {} };
    return migrated;
  }

  // Migrate v2 -> v3 (add jobs map)
  if (existingAny.version === 2) {
    const migrated: IntelligenceStore = { version: STORE_VERSION, entries: existingAny.entries ?? {}, jobs: existingAny.jobs ?? {} };
    return migrated;
  }

  // Migrate v3 -> v4 (add job heartbeat/payload; no structural change required)
  if (existingAny.version === 3) {
    const migrated: IntelligenceStore = { version: STORE_VERSION, entries: existingAny.entries ?? {}, jobs: existingAny.jobs ?? {} };
    return migrated;
  }

  if (existingAny.version === STORE_VERSION) return existingAny as IntelligenceStore;
  return { version: STORE_VERSION, entries: existingAny.entries ?? {}, jobs: existingAny.jobs ?? {} };
}

export async function saveStore(store: IntelligenceStore): Promise<void> {
  await writeJsonFileAtomic(STORE_PATH, store);
}

export function buildEntryKey(input: {
  target?: string;
  asset?: string;
  company?: string;
  indication?: string;
}): string {
  const parts = [
    input.target?.trim(),
    input.asset?.trim(),
    input.company?.trim(),
    input.indication?.trim(),
  ]
    .filter(Boolean)
    .map((p) => String(p).toLowerCase().replace(/\s+/g, ' ').trim());

  return parts.length ? parts.join('|') : 'global';
}

export async function upsertFeedItems(args: {
  entryKey: string;
  fetchedAt: string;
  items: Array<{
    id: string;
    url: string;
    title: string;
    source: string;
    kind: string;
    publishedAt: string;
    summary: string;
  }>;
}): Promise<{ unreadCount: number; lastSeenAt?: string }> {
  const store = await loadStore();
  const now = new Date().toISOString();
  const entry = store.entries[args.entryKey] ?? { items: [] };

  const existingByUrl = new Map<string, StoredFeedItem>();
  for (const it of entry.items) existingByUrl.set(normalizeUrl(it.url), it);

  for (const it of args.items) {
    const key = normalizeUrl(it.url);
    const existing = existingByUrl.get(key);
    if (existing) {
      // Refresh fields in case they changed.
      existing.title = it.title;
      existing.source = it.source;
      existing.kind = it.kind;
      existing.publishedAt = it.publishedAt;
      existing.summary = it.summary;
      continue;
    }

    const stored: StoredFeedItem = {
      id: it.id,
      url: it.url,
      title: it.title,
      source: it.source,
      kind: it.kind,
      publishedAt: it.publishedAt,
      summary: it.summary,
      firstSeenAt: now,
    };
    entry.items.push(stored);
    existingByUrl.set(key, stored);
  }

  entry.lastFetchedAt = args.fetchedAt;

  // Keep the most recent N items
  entry.items = entry.items
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, MAX_ITEMS_PER_ENTRY);

  store.entries[args.entryKey] = entry;
  await saveStore(store);

  const unreadCount = computeUnreadCount({ entry, nowIso: now });
  return { unreadCount, lastSeenAt: entry.lastSeenAt };
}

export async function markSeen(entryKey: string): Promise<{ lastSeenAt: string; unreadCount: number }> {
  const store = await loadStore();
  const now = new Date().toISOString();
  const entry = store.entries[entryKey] ?? { items: [] };
  entry.lastSeenAt = now;
  store.entries[entryKey] = entry;
  await saveStore(store);
  return { lastSeenAt: now, unreadCount: 0 };
}

export async function getUnread(entryKey: string): Promise<{ unreadCount: number; lastSeenAt?: string; lastFetchedAt?: string }> {
  const store = await loadStore();
  const entry = store.entries[entryKey];
  if (!entry) return { unreadCount: 0 };
  return { unreadCount: computeUnreadCount({ entry, nowIso: new Date().toISOString() }), lastSeenAt: entry.lastSeenAt, lastFetchedAt: entry.lastFetchedAt };
}

export async function getFeedItems(entryKey: string): Promise<{ items: StoredFeedItem[]; lastSeenAt?: string; lastFetchedAt?: string } | null> {
  const store = await loadStore();
  const entry = store.entries[entryKey];
  if (!entry) return null;
  return { items: entry.items ?? [], lastSeenAt: entry.lastSeenAt, lastFetchedAt: entry.lastFetchedAt };
}

export async function saveProcessedItems(entryKey: string, processedItems: any[]): Promise<void> {
  const store = await loadStore();
  const entry = store.entries[entryKey] ?? { items: [] };
  entry.processedItems = processedItems;
  store.entries[entryKey] = entry;
  await saveStore(store);
}

export async function saveDigest(entryKey: string, digest: StoredDigest): Promise<void> {
  const store = await loadStore();
  const entry = store.entries[entryKey] ?? { items: [] };
  entry.digest = digest;
  store.entries[entryKey] = entry;
  await saveStore(store);
}

export async function getDigest(entryKey: string): Promise<StoredDigest | null> {
  const store = await loadStore();
  const entry = store.entries[entryKey];
  return entry?.digest ?? null;
}

function randomId(prefix: string): string {
  // Good enough for local job IDs
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createJob(entryKey: string, payload?: any): Promise<IntelligenceJob> {
  const store = await loadStore();
  const now = new Date().toISOString();
  const job: IntelligenceJob = {
    id: randomId('job'),
    entryKey,
    type: 'digest',
    status: 'queued',
    createdAt: now,
    progress: 0,
    message: 'Queued',
    payload,
  };
  store.jobs = store.jobs ?? {};
  store.jobs[job.id] = job;
  await saveStore(store);
  return job;
}

export async function updateJob(jobId: string, patch: Partial<IntelligenceJob>): Promise<IntelligenceJob | null> {
  const store = await loadStore();
  const job = store.jobs?.[jobId];
  if (!job) return null;
  const next = { ...job, ...patch };
  store.jobs = store.jobs ?? {};
  store.jobs[jobId] = next;
  await saveStore(store);
  return next;
}

export async function getJob(jobId: string): Promise<IntelligenceJob | null> {
  const store = await loadStore();
  return store.jobs?.[jobId] ?? null;
}

export async function findActiveJob(entryKey: string): Promise<IntelligenceJob | null> {
  const store = await loadStore();
  const jobs = Object.values(store.jobs ?? {});
  const active = jobs
    .filter((j) => j.entryKey === entryKey && (j.status === 'queued' || j.status === 'running'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return active[0] ?? null;
}

function computeUnreadCount(args: { entry: StoreEntry; nowIso: string }): number {
  const lastSeenAt = args.entry.lastSeenAt ? new Date(args.entry.lastSeenAt).getTime() : 0;
  return args.entry.items.reduce((acc, it) => {
    const seen = new Date(it.firstSeenAt).getTime();
    return seen > lastSeenAt ? acc + 1 : acc;
  }, 0);
}

/**
 * Retrieve previously stored feed items for a given entry key.
 * Used as a fallback when live sources fail.
 * Will also search for entries that start with the given key (e.g. 'trop2' matches 'trop2|oncology').
 */
export async function getStoredFeedItems(entryKey: string): Promise<{
  items: StoredFeedItem[];
  lastFetchedAt?: string;
  matchedKey?: string;
}> {
  const store = await loadStore();
  
  // Try exact match first
  const exactEntry = store.entries[entryKey];
  if (exactEntry && exactEntry.items.length > 0) {
    return { items: exactEntry.items, lastFetchedAt: exactEntry.lastFetchedAt, matchedKey: entryKey };
  }
  
  // Try to find a related entry that starts with the given key
  // This handles cases like entryKey='trop2' matching 'trop2|oncology'
  const normalizedKey = entryKey.toLowerCase();
  for (const [key, entry] of Object.entries(store.entries)) {
    if (key.toLowerCase().startsWith(normalizedKey) && entry.items.length > 0) {
      console.info(`[store] Found related entry: ${key} for query: ${entryKey}`);
      return { items: entry.items, lastFetchedAt: entry.lastFetchedAt, matchedKey: key };
    }
  }
  
  // Try to find any entry that contains the target term
  for (const [key, entry] of Object.entries(store.entries)) {
    if (key.toLowerCase().includes(normalizedKey) && entry.items.length > 0) {
      console.info(`[store] Found partial match entry: ${key} for query: ${entryKey}`);
      return { items: entry.items, lastFetchedAt: entry.lastFetchedAt, matchedKey: key };
    }
  }
  
  return { items: [] };
}

