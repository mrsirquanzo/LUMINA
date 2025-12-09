import { useState, useMemo } from 'react';
import {
  FileText,
  Newspaper,
  Handshake,
  Shield,
  Bookmark,
  Share2,
  FolderPlus,
  ExternalLink,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { INTELLIGENCE_FEED } from '../../constants';
import { format, parseISO } from 'date-fns';

type FeedItemType = 'publication' | 'deal' | 'regulatory' | 'news' | 'clinical';
type RelevanceFilter = 'Target-specific' | 'Market' | 'Competitive' | 'All';

interface FeedItem {
  id: number;
  date: string;
  type: FeedItemType;
  title: string;
  source: string;
  summary: string;
  relevance: 'high' | 'medium' | 'low';
  link: string;
  tags?: string[];
}

export default function IntelligenceFeed() {
  const [typeFilter, setTypeFilter] = useState<FeedItemType | 'All'>('All');
  const [relevanceFilter, setRelevanceFilter] = useState<RelevanceFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());

  const feedItems: FeedItem[] = INTELLIGENCE_FEED.map((item) => ({
    id: item.id,
    date: item.date,
    type: (item.type === 'publication' || item.type === 'deal' || item.type === 'regulatory' || item.type === 'news' || item.type === 'clinical') 
      ? item.type 
      : 'news' as FeedItemType,
    title: item.title,
    source: item.source,
    summary: item.summary,
    relevance: item.relevance as 'high' | 'medium' | 'low',
    link: item.link,
    tags: item.title.toLowerCase().includes('trop2') ? ['TROP2', 'ADC'] : ['Market', 'Industry'],
  }));

  const filteredItems = useMemo(() => {
    let filtered = [...feedItems];

    // Type filter
    if (typeFilter !== 'All') {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    // Relevance filter
    if (relevanceFilter !== 'All') {
      if (relevanceFilter === 'Target-specific') {
        filtered = filtered.filter((item) => item.relevance === 'high');
      } else {
        filtered = filtered.filter((item) => item.title.toLowerCase().includes(relevanceFilter.toLowerCase()));
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query) ||
          item.source.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [feedItems, typeFilter, relevanceFilter, searchQuery]);

  const getTypeIcon = (type: FeedItemType) => {
    switch (type) {
      case 'publication':
        return FileText;
      case 'news':
        return Newspaper;
      case 'deal':
        return Handshake;
      case 'regulatory':
        return Shield;
      case 'clinical':
        return FileText;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: FeedItemType) => {
    switch (type) {
      case 'publication':
        return 'bg-info/20 text-info border-info/50';
      case 'news':
        return 'bg-warning/20 text-warning border-warning/50';
      case 'deal':
        return 'bg-success/20 text-success border-success/50';
      case 'regulatory':
        return 'bg-primary/20 text-primary border-primary/50';
      case 'clinical':
        return 'bg-info/20 text-info border-info/50';
      default:
        return 'bg-surfaceElevated text-textSecondary';
    }
  };

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'high':
        return 'bg-danger';
      case 'medium':
        return 'bg-warning';
      case 'low':
        return 'bg-textTertiary';
      default:
        return 'bg-textTertiary';
    }
  };

  const toggleBookmark = (id: number) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-textPrimary mb-2">Intelligence Feed</h1>
        <p className="text-textSecondary">
          Stay updated with the latest research, deals, and regulatory developments
        </p>
      </div>

      {/* Filter Bar */}
      <div className="space-y-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textTertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feed items..."
            className="w-full pl-10 pr-4 py-3 bg-surface border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-textTertiary hover:text-textPrimary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-textTertiary" />
            <div className="flex gap-1 bg-surfaceElevated rounded-lg p-1">
              {(['All', 'publication', 'news', 'deal', 'regulatory'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                    typeFilter === type
                      ? 'bg-surface text-textPrimary'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  {type === 'All' ? 'All' : type === 'publication' ? 'Papers' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Relevance Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-textTertiary">Relevance:</span>
            <div className="flex gap-1 bg-surfaceElevated rounded-lg p-1">
              {(['All', 'Target-specific', 'Market', 'Competitive'] as const).map((rel) => (
                <button
                  key={rel}
                  onClick={() => setRelevanceFilter(rel)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    relevanceFilter === rel
                      ? 'bg-surface text-textPrimary'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  {rel}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="ml-auto text-sm text-textTertiary">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      </div>

      {/* Feed Items */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const Icon = getTypeIcon(item.type);
            return (
              <div
                key={item.id}
                className="group bg-surface border border-white/5 rounded-xl p-5 hover:border-white/10 hover:shadow-lg transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-1 rounded capitalize ${getTypeColor(item.type)}`}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleBookmark(item.id)}
                      className={`p-1.5 rounded-lg hover:bg-surfaceElevated transition-colors ${
                        bookmarked.has(item.id) ? 'text-warning' : 'text-textTertiary'
                      }`}
                      aria-label="Bookmark"
                    >
                      <Bookmark
                        className={`w-4 h-4 ${bookmarked.has(item.id) ? 'fill-current' : ''}`}
                      />
                    </button>
                    <button
                      className="p-1.5 rounded-lg hover:bg-surfaceElevated text-textTertiary hover:text-textPrimary transition-colors"
                      aria-label="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg hover:bg-surfaceElevated text-textTertiary hover:text-textPrimary transition-colors"
                      aria-label="Add to Workspace"
                    >
                      <FolderPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-surfaceElevated text-textSecondary rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h3 className="text-base font-semibold text-textPrimary mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>

                {/* Summary */}
                <p className="text-sm text-textSecondary mb-4 line-clamp-2">{item.summary}</p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-textTertiary">{item.source}</span>
                    <span className="text-xs text-textTertiary">
                      {format(parseISO(item.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getRelevanceColor(item.relevance)}`} />
                      <span className="text-xs text-textTertiary capitalize">{item.relevance}</span>
                    </div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-surfaceElevated text-textTertiary hover:text-textPrimary transition-colors"
                      aria-label="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-textTertiary mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-textSecondary mb-2">No items found</p>
          <p className="text-sm text-textTertiary">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* Load More / Pagination */}
      {filteredItems.length > 0 && (
        <div className="mt-8 text-center">
          <button className="px-6 py-3 bg-surfaceElevated border border-white/10 rounded-lg hover:bg-surface transition-colors text-textPrimary">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
