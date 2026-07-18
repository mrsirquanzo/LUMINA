import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUpRight, Database, FlaskConical, FileText } from 'lucide-react';
import { DossierCard, type DossierItem } from '../dossiers/DossierCard';
import { DossierDrawer } from '../dossiers/DossierDrawer';
import { useBriefingStore } from '../../lib/research/briefingStore';
import { useProjectStore, type Project } from '../../lib/projects/store';
import { getWorkbookScenario } from '../../lib/workbook/scenarios';
import type { BriefingView } from '../../lib/research/sseTypes';

interface ProjectWorkspaceProps {
  projectId: string;
  onOpenWorkbook: (capability: string, scenarioId: string) => void;
}

export function getProjectReports(
  project: Project | undefined,
  briefings: Record<string, BriefingView>,
  savedAt: Record<string, number>,
): DossierItem[] {
  const target = project?.target.trim().toLowerCase();
  if (!target) return [];
  return Object.entries(briefings)
    .filter(([, briefing]) => briefing.target?.trim().toLowerCase() === target)
    .map(([runId, briefing]) => ({
      runId,
      target: briefing.target,
      verdict: briefing.recommendation?.verdict,
      snippet: briefing.executiveRead?.split('\n')[0] ?? '',
      savedAt: savedAt[runId] ?? 0,
      refs: briefing.references?.length ?? 0,
    }))
    .sort((a, b) => b.savedAt - a.savedAt);
}

export function getProjectDatasetFileSize(project: Project): number | undefined {
  if (project.datasets.length !== 1 || project.experiments.length !== 1) return undefined;
  const experiment = project.experiments[0];
  return getWorkbookScenario(experiment.capability, experiment.scenarioId)?.file.sizeMB;
}

function SectionHeading({ icon: Icon, label, count }: { icon: typeof FileText; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-2.5">
      <Icon className="h-3.5 w-3.5 text-textTertiary" strokeWidth={1.75} aria-hidden="true" />
      <h2 className="t-eyebrow text-textSecondary">{label}</h2>
      <span className="t-meta ml-auto tabular-nums text-textTertiary">{count}</span>
    </div>
  );
}

export function ProjectWorkspace({ projectId, onOpenWorkbook }: ProjectWorkspaceProps) {
  const project = useProjectStore((state) => state.projects.find((item) => item.id === projectId));
  const briefings = useBriefingStore((state) => state.briefings);
  const savedAt = useBriefingStore((state) => state.savedAt);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project?.name ?? '');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setName(project?.name ?? ''), [project?.name]);
  useEffect(() => { if (editing) nameInputRef.current?.select(); }, [editing]);

  const reports = useMemo(() => getProjectReports(project, briefings, savedAt), [briefings, project, savedAt]);

  if (!project) {
    return <div className="mx-auto max-w-[940px] px-6 py-20"><p className="t-body text-textSecondary">Project not found.</p></div>;
  }

  const commitName = () => {
    const nextName = name.trim();
    if (nextName) useProjectStore.getState().rename(project.id, nextName);
    else setName(project.name);
    setEditing(false);
  };

  const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commitName();
    if (event.key === 'Escape') {
      setName(project.name);
      setEditing(false);
    }
  };

  const emptyReports = project.target
    ? `No reports yet - ask Sonny about ${project.target}.`
    : 'No reports are linked to this workspace.';
  const datasetFileSize = getProjectDatasetFileSize(project);

  return (
    <div className="min-h-full w-full bg-page">
      <div className="mx-auto max-w-[940px] px-4 pb-20 pt-10 sm:px-8 sm:pt-[60px]">
        <header className="mb-12 flex items-start gap-4">
          <span className="emoji-glyph mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white text-[25px] shadow-card" aria-hidden="true">
            {project.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="t-eyebrow mb-1.5 text-textTertiary">Project workspace</p>
            {editing ? (
              <input
                ref={nameInputRef}
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={commitName}
                onKeyDown={handleNameKeyDown}
                className="t-h1 w-full rounded-lg border border-primary/30 bg-white px-2 py-1 text-textPrimary outline-none ring-2 ring-primary/10"
                aria-label="Project name"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="t-h1 max-w-full rounded-lg px-0 py-1 text-left text-textPrimary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                title="Rename project"
              >
                {project.name}
              </button>
            )}
            {project.target && <p className="t-meta mt-1 text-textTertiary">Reports matched to {project.target}</p>}
          </div>
        </header>

        <div className="space-y-12">
          <section aria-labelledby="workspace-reports">
            <div id="workspace-reports"><SectionHeading icon={FileText} label="Reports" count={reports.length} /></div>
            {reports.length > 0 ? (
              <div className="mt-4 space-y-3">
                {reports.map((report) => <DossierCard key={report.runId} item={report} onClick={() => setSelectedRunId(report.runId)} />)}
              </div>
            ) : (
              <p className="t-body-sm py-7 text-textTertiary">{emptyReports}</p>
            )}
          </section>

          <section aria-labelledby="workspace-experiments">
            <div id="workspace-experiments"><SectionHeading icon={FlaskConical} label="Experiments" count={project.experiments.length} /></div>
            {project.experiments.length > 0 ? (
              <div className="divide-y divide-border">
                {project.experiments.map((experiment) => (
                  <button
                    key={experiment.id}
                    type="button"
                    onClick={() => onOpenWorkbook(experiment.capability, experiment.scenarioId)}
                    className="tactile flex w-full items-center gap-3 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <span className="t-body-sm min-w-0 flex-1 font-semibold text-textPrimary">{experiment.label}</span>
                    <span className="t-eyebrow rounded-md border border-border bg-white px-2 py-1 text-textTertiary">{experiment.capability}</span>
                    <ArrowUpRight className="h-4 w-4 flex-none text-textTertiary" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="t-body-sm py-7 text-textTertiary">No experiments pinned.</p>
            )}
          </section>

          <section aria-labelledby="workspace-datasets">
            <div id="workspace-datasets"><SectionHeading icon={Database} label="Datasets" count={project.datasets.length} /></div>
            {project.datasets.length > 0 ? (
              <div className="divide-y divide-border">
                {project.datasets.map((dataset) => (
                  <div key={dataset.name} className="flex items-center gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="t-body-sm font-semibold text-textPrimary">{dataset.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {datasetFileSize !== undefined && <span className="t-eyebrow tabular-nums text-textTertiary">{datasetFileSize.toFixed(2)} MB</span>}
                        {dataset.note && <p className="t-meta text-pretty text-textTertiary">{dataset.note}</p>}
                      </div>
                    </div>
                    {dataset.href && (
                      <a
                        href={dataset.href}
                        target="_blank"
                        rel="noreferrer"
                        className="t-meta rounded-md px-2 py-1 font-semibold text-primary transition-colors hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        view
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="t-body-sm py-7 text-textTertiary">No datasets pinned.</p>
            )}
          </section>
        </div>
      </div>

      <DossierDrawer runId={selectedRunId} onClose={() => setSelectedRunId(null)} />
    </div>
  );
}

export default ProjectWorkspace;
