/**
 * Recent Patent Analysis List
 * Shows recent patent analyses that can be restored
 */

import { useState, useEffect } from 'react';
import { FileText, Clock, ArrowRight } from 'lucide-react';
import type { PatentExtractionResult } from '../../lib/patentParsing/types';
import type { QualityAssessment } from '../../lib/patentParsing/qualityAssurance';

interface RecentPatent {
  id: string;
  number: string;
  title: string;
  analyzedAt: string;
  parsedResult?: PatentExtractionResult;
  qualityAssessment?: QualityAssessment;
  ftoRiskData?: any;
  tileId?: string;
}

interface RecentPatentAnalysisListProps {
  onRestoreAnalysis: (patent: RecentPatent) => void;
}

export default function RecentPatentAnalysisList({ onRestoreAnalysis }: RecentPatentAnalysisListProps) {
  const [recentPatents, setRecentPatents] = useState<RecentPatent[]>([]);

  useEffect(() => {
    // Load recent patents from localStorage
    const stored = localStorage.getItem('lumina-recent-patents');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Filter to only show patents with full analysis data
        const withAnalysis = parsed.filter((p: RecentPatent) => p.parsedResult);
        setRecentPatents(withAnalysis.slice(0, 5)); // Show top 5
      } catch (e) {
        console.error('Failed to load recent patents:', e);
      }
    }
  }, []);

  // Listen for updates
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('lumina-recent-patents');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const withAnalysis = parsed.filter((p: RecentPatent) => p.parsedResult);
          setRecentPatents(withAnalysis.slice(0, 5));
        } catch (e) {
          console.error('Failed to load recent patents:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events from PatentAgentInterface
    window.addEventListener('patent-analysis-saved', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('patent-analysis-saved', handleStorageChange);
    };
  }, []);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (recentPatents.length === 0) {
    return (
      <div className="text-center py-4 text-textTertiary">
        <p className="text-xs">No recent analyses</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentPatents.map((patent) => (
        <button
          key={patent.id}
          onClick={() => onRestoreAnalysis(patent)}
          className="w-full p-3 bg-surfaceElevated border border-white/10 rounded-lg hover:border-primary/50 transition-colors text-left flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-textPrimary truncate">
              {patent.number}
            </div>
            <div className="flex items-center gap-2 text-xs text-textSecondary">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(patent.analyzedAt)}</span>
              {patent.tileId && (
                <>
                  <span>•</span>
                  <span className="text-primary">Tile created</span>
                </>
              )}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-textTertiary group-hover:text-primary transition-colors flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}
