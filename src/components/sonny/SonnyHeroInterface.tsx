import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  TrendingUp,
  Sparkles,
  Network,
  Zap,
  Clock,
  Users,
  Bell,
  History,
  Database,
  MessageSquare,
  Download,
  ChevronDown,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock,
  Send,
} from 'lucide-react';
import {
  AgentInterfaceLayout,
  DocumentUploadZone,
  FutureAnalysisDropdown,
  AgentIconNavigation,
} from '../agents/shared';
import type { AgentType } from '../../lib/multiAgentTypes';
import { exportMarkdownReport, downloadTextFile } from '../../lib/reportExport';

// Types
interface SonnyHeroInterfaceProps {
  targetName?: string;
  onClose?: () => void;
  isDemo?: boolean;
  currentAgent?: AgentType | 'sonny';
  onAgentSelect?: (agent: AgentType | 'sonny') => void;
}

interface AnalysisResult {
  type: 'executive-brief' | 'investment-thesis';
  status: 'pending' | 'analyzing' | 'complete' | 'error';
  progress?: number;
  agentStatuses?: Record<string, 'pending' | 'active' | 'complete'>;
  content?: string;
  sections?: any;
}

// Agent configuration for status display
const AGENTS = [
  { id: 'clinical', name: 'Clinical', color: 'blue' },
  { id: 'patent', name: 'Patent', color: 'purple' },
  { id: 'financial', name: 'Financial', color: 'green' },
  { id: 'regulatory', name: 'Regulatory', color: 'orange' },
  { id: 'market', name: 'Market', color: 'cyan' },
  { id: 'biology', name: 'Biology', color: 'emerald' },
];

// Custom Hero Skill Card for Sonny with gradient theme
const SonnyHeroSkillCard: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  isLoading?: boolean;
  badge?: string;
}> = ({ title, description, icon: Icon, onClick, isLoading = false, badge }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={isLoading}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full p-5 rounded-xl border-2 bg-gradient-to-br from-purple-500/20 via-blue-500/15 to-cyan-500/10 border-purple-500/30 hover:border-purple-400 backdrop-blur-sm transition-all text-left group cursor-pointer disabled:opacity-50 disabled:cursor-wait"
    >
      {badge && (
        <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-300 font-medium">
          {badge}
        </span>
      )}

      <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20">
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Icon className="w-6 h-6 text-purple-400" />
          </motion.div>
        ) : (
          <Icon className="w-6 h-6 text-purple-400" />
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white/90">
        {title}
      </h3>
      <p className="text-sm text-gray-400 leading-relaxed">
        {description}
      </p>

      <motion.div
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </motion.div>
    </motion.button>
  );
};

export const SonnyHeroInterface: React.FC<SonnyHeroInterfaceProps> = ({
  targetName = '',
  onClose,
  isDemo = true,
  currentAgent = 'sonny',
  onAgentSelect,
}) => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showFutureOptions, setShowFutureOptions] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Hero Skill 1: Executive Target Brief
  const handleExecutiveBrief = useCallback(async () => {
    setAnalysisResult({
      type: 'executive-brief',
      status: 'analyzing',
      progress: 0,
      agentStatuses: {
        clinical: 'pending',
        patent: 'pending',
        financial: 'pending',
        regulatory: 'pending',
        market: 'pending',
        biology: 'pending',
      },
    });

    // Simulate multi-agent analysis with progressive updates
    const agents = ['biology', 'clinical', 'patent', 'regulatory', 'market', 'financial'];

    for (let i = 0; i < agents.length; i++) {
      await new Promise(resolve => setTimeout(resolve, isDemo ? 800 : 2000));

      setAnalysisResult(prev => ({
        ...prev!,
        progress: ((i + 1) / agents.length) * 100,
        agentStatuses: {
          ...prev!.agentStatuses!,
          [agents[i]]: 'complete',
          ...(i < agents.length - 1 ? { [agents[i + 1]]: 'active' } : {}),
        },
      }));
    }

    // Synthesis phase
    await new Promise(resolve => setTimeout(resolve, isDemo ? 500 : 1500));

    setAnalysisResult(prev => ({
      ...prev!,
      status: 'complete',
      progress: 100,
      sections: {
        overview: `${targetName || 'This target'} represents a high-priority therapeutic target with strong biological validation and favorable competitive positioning.`,
        keyFindings: [
          'Strong genetic association with disease (LOF protective)',
          '3 active Phase 2 trials with positive interim data',
          'FTO clear with strategic white space identified',
          'Market opportunity: $2.8B by 2030',
          'Expedited pathway eligible (Breakthrough potential)',
        ],
        riskSummary: {
          biology: 'Low',
          clinical: 'Medium',
          ip: 'Low',
          regulatory: 'Low',
          commercial: 'Medium',
        },
        opportunityScore: 8.4,
        recommendations: [
          'Prioritize for internal development',
          'Consider partnership for Phase 3',
          'File provisional patents in identified white spaces',
        ],
      },
    }));
  }, [targetName, isDemo]);

  // Hero Skill 2: Investment Thesis Generator
  const handleInvestmentThesis = useCallback(async () => {
    setAnalysisResult({
      type: 'investment-thesis',
      status: 'analyzing',
      progress: 0,
      agentStatuses: {
        clinical: 'pending',
        patent: 'pending',
        financial: 'pending',
        regulatory: 'pending',
        market: 'pending',
        biology: 'pending',
      },
    });

    // Similar progressive analysis
    const agents = ['financial', 'market', 'clinical', 'patent', 'regulatory', 'biology'];

    for (let i = 0; i < agents.length; i++) {
      await new Promise(resolve => setTimeout(resolve, isDemo ? 800 : 2000));

      setAnalysisResult(prev => ({
        ...prev!,
        progress: ((i + 1) / agents.length) * 100,
        agentStatuses: {
          ...prev!.agentStatuses!,
          [agents[i]]: 'complete',
          ...(i < agents.length - 1 ? { [agents[i + 1]]: 'active' } : {}),
        },
      }));
    }

    await new Promise(resolve => setTimeout(resolve, isDemo ? 500 : 1500));

    setAnalysisResult(prev => ({
      ...prev!,
      status: 'complete',
      progress: 100,
      sections: {
        thesis: `${targetName || 'This target'}-targeting therapeutics represent a compelling investment opportunity with strong risk-adjusted returns based on validated biology, clear regulatory pathway, and significant unmet medical need.`,
        bullCase: [
          'First-in-class mechanism with differentiated efficacy profile',
          'Large addressable market ($4.2B TAM) with limited competition',
          'Strong IP position with 12+ years of exclusivity',
          'Breakthrough Therapy designation likely (70% probability)',
          'Multiple M&A precedents support premium valuation',
        ],
        bearCase: [
          'Phase 3 execution risk in competitive enrollment environment',
          'Pricing pressure from payer pushback on premium pricing',
          'Potential for fast-follower competition post-approval',
          'Manufacturing complexity may impact margins',
        ],
        keyRisks: [
          { risk: 'Clinical failure', probability: '25%', impact: 'High', mitigant: 'Strong Phase 2 data, biomarker strategy' },
          { risk: 'Regulatory delay', probability: '15%', impact: 'Medium', mitigant: 'Pre-submission meetings scheduled' },
          { risk: 'Commercial underperformance', probability: '20%', impact: 'Medium', mitigant: 'Differentiated label, KOL support' },
        ],
        comparableDeals: [
          { target: 'Similar Target A', acquirer: 'Big Pharma X', value: '$2.1B', stage: 'Phase 2', year: 2023 },
          { target: 'Similar Target B', acquirer: 'Big Pharma Y', value: '$3.8B', stage: 'Phase 3', year: 2024 },
        ],
        valuationRange: {
          conservative: '$1.2B',
          base: '$2.4B',
          optimistic: '$4.1B',
        },
        recommendation: 'BUY',
        confidenceScore: 7.8,
      },
    }));
  }, [targetName, isDemo]);

  // Export handler
  const handleExport = async (format: string) => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      if (!analysisResult || analysisResult.status !== 'complete') return;

      const now = new Date();
      const dateStamp = now.toISOString().split('T')[0];
      const safeTarget = (targetName || 'target').replace(/[^a-zA-Z0-9-_]+/g, '-');

      const title = `${targetName || 'Target'} • Sonny ${analysisResult.type.replace('-', ' ')}`;
      const content =
        (typeof analysisResult.content === 'string' && analysisResult.content.trim())
          ? analysisResult.content.trim()
          : `## Sonny Analysis (Structured)\n\n\`\`\`json\n${JSON.stringify(analysisResult.sections ?? {}, null, 2)}\n\`\`\`\n`;

      const markdown = [
        `# ${title}`,
        '',
        `Generated: ${now.toLocaleString()}`,
        '',
        '---',
        '',
        content,
        '',
      ].join('\n');

      if (format === 'pdf' || format === 'pptx' || format === 'docx') {
        exportMarkdownReport(format, `${safeTarget}-sonny-${analysisResult.type}-${dateStamp}`, title, markdown);
        return;
      }

      if (format === 'share') {
        downloadTextFile(`${safeTarget}-sonny-${analysisResult.type}-${dateStamp}.md`, markdown, 'text/markdown;charset=utf-8');
        return;
      }

      if (format === 'email') {
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(markdown.slice(0, 8000)); // keep mailto reasonable
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Document upload handler
  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  // Future analysis options
  const futureAnalysisOptions = [
    {
      id: 'custom-query',
      label: 'Custom Multi-Agent Query',
      description: 'Ask any question across all agents',
      icon: MessageSquare,
      onClick: () => console.log('Custom query'),
    },
    {
      id: 'fast-mode',
      label: 'Fast Mode Analysis',
      description: 'Parallel 30-second snapshot',
      icon: Zap,
      onClick: () => console.log('Fast mode'),
    },
    {
      id: 'thorough-mode',
      label: 'Thorough Mode Analysis',
      description: 'Sequential deep-dive (2-3 min)',
      icon: Clock,
      onClick: () => console.log('Thorough mode'),
    },
    {
      id: 'agent-routing',
      label: 'Route to Specific Agent',
      description: 'Direct question to one agent',
      icon: Network,
      onClick: () => console.log('Agent routing'),
    },
    {
      id: 'team-collab',
      label: 'Team Collaboration Report',
      description: 'Shared analysis workspace',
      icon: Users,
      comingSoon: true,
    },
    {
      id: 'monitoring',
      label: 'Automated Monitoring',
      description: 'Set up ongoing target alerts',
      icon: Bell,
      comingSoon: true,
    },
    {
      id: 'history',
      label: 'Analysis History',
      description: 'Compare with previous analyses',
      icon: History,
      comingSoon: true,
    },
    {
      id: 'external-data',
      label: 'External Data Integration',
      description: 'Connect CRM, deal pipeline',
      icon: Database,
      comingSoon: true,
    },
  ];

  // Reset analysis
  const handleReset = () => {
    setAnalysisResult(null);
  };

  // Chat handler
  const handleChatSend = async () => {
    if (!chatMessage.trim()) return;
    const message = chatMessage;
    setChatMessage('');

    try {
      // Demo mode should not call serverless orchestration.
      if (isDemo) return;

      // Live: use serverless orchestrator endpoint
      const orchestratorPath =
        typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? '/api/agents/orchestrator'
          : '/api/orchestrator';

      const response = await fetch(orchestratorPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          documents: [],
          mode: 'fast',
          isDemo: false,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        // Handle SSE stream or response
        console.log('Sonny response initiated');
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  // Custom export dropdown for Sonny (gradient theme)
  const exportButton = analysisResult?.status === 'complete' ? (
    <div className="relative">
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 border-purple-500/30 hover:border-purple-400 text-purple-300 disabled:opacity-50"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">Export</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {showExportMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-64 rounded-xl bg-gray-900 border border-white/10 shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2">
              {[
                { id: 'pdf', label: 'PDF Report', desc: 'Formatted executive document' },
                { id: 'pptx', label: 'PowerPoint', desc: 'Board-ready presentation' },
                { id: 'docx', label: 'Word Document', desc: 'Editable format' },
                { id: 'share', label: 'Share Link', desc: 'Secure shareable link' },
                { id: 'email', label: 'Email Summary', desc: 'Send key findings' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleExport(option.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ) : null;

  // Chat section
  const chatSection = (
    <div className="flex gap-3">
      <input
        type="text"
        value={chatMessage}
        onChange={(e) => setChatMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSend();
          }
        }}
        placeholder="Ask Sonny anything about this target..."
        className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
      />
      <button
        onClick={handleChatSend}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white font-medium transition-all"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );

  // Custom layout wrapper for Sonny (gradient theme)
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="h-full flex flex-col bg-gray-900/95 backdrop-blur-xl border-l border-white/10"
    >
      {/* Header with gradient theme */}
      <div className="relative px-6 py-4 bg-gradient-to-b from-purple-500/20 via-blue-500/10 to-transparent border-b border-white/10">
        {/* Agent Icon Navigation - Show if enabled */}
        {onAgentSelect && (
          <div className="mb-4 pb-4 border-b border-white/10">
            <AgentIconNavigation
              currentAgent={currentAgent}
              onAgentSelect={onAgentSelect}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500/30 via-blue-500/30 to-cyan-500/30 border border-purple-500/20">
              <span
                className="text-4xl leading-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.25)]"
                aria-hidden="true"
              >
                🤖
              </span>
              <span className="sr-only">Sonny</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Sonny
              </h2>
              <p className="text-sm text-gray-400">
                {targetName?.trim() ? `Analyzing: ${targetName.trim()}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Show Hero Skills or Analysis Results */}
        {!analysisResult ? (
          <>
            {/* Hero Skills Section */}
            <section>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                Intelligence Reports
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <SonnyHeroSkillCard
                  title="Executive Target Brief"
                  description="Generate a comprehensive 1-page executive summary synthesizing insights from all 6 AI agents - covering biology, clinical, IP, financials, regulatory, and market"
                  icon={FileText}
                  onClick={handleExecutiveBrief}
                  isLoading={false}
                  badge="6-Agent Synthesis"
                />
                <SonnyHeroSkillCard
                  title="Investment Thesis Generator"
                  description="AI-powered investment thesis with bull/bear cases, valuation framework, and risk-adjusted opportunity scoring based on multi-agent intelligence"
                  icon={TrendingUp}
                  onClick={handleInvestmentThesis}
                  isLoading={false}
                  badge="AI-Powered"
                />
              </div>
            </section>

            {/* Document Upload Section */}
            <section>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                Add Context Documents
              </h3>
              <DocumentUploadZone
                themeColor="purple"
                onFilesUploaded={handleFilesUploaded}
                acceptedTypes={['.pdf', '.docx', '.xlsx', '.csv', '.txt', '.pptx']}
              />
              <p className="text-xs text-gray-500 mt-2">
                Upload existing reports, deal memos, or research documents to enrich analysis
              </p>
            </section>

            {/* Export Section - Moved to bottom */}
            {exportButton && (
              <section>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                  Export Analysis
                </h3>
                <div className="w-full">
                  {exportButton}
                </div>
              </section>
            )}

            {/* Future Analysis Options */}
            <section>
              <FutureAnalysisDropdown
                themeColor="purple"
                options={futureAnalysisOptions}
                label="More Analysis Options"
              />
            </section>
          </>
        ) : (
          /* Analysis Results View */
          <AnalysisResultsView
            result={analysisResult}
            onReset={handleReset}
            targetName={targetName}
          />
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t border-white/10 p-4">
        {chatSection}
      </div>
    </motion.div>
  );
};

// Analysis Results View Component
const AnalysisResultsView: React.FC<{
  result: AnalysisResult;
  onReset: () => void;
  targetName: string;
}> = ({ result, onReset, targetName }) => {
  if (result.status === 'analyzing') {
    return (
      <div className="space-y-6">
        {/* Progress Header */}
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-purple-400" />
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {result.type === 'executive-brief' ? 'Generating Executive Brief' : 'Building Investment Thesis'}
          </h3>
          <p className="text-gray-400">Coordinating 6 specialized agents...</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${result.progress}%` }}
            className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500"
          />
        </div>

        {/* Agent Status Grid */}
        <div className="grid grid-cols-3 gap-3">
          {AGENTS.map((agent) => {
            const status = result.agentStatuses?.[agent.id] || 'pending';
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0.5 }}
                animate={{
                  opacity: status === 'pending' ? 0.5 : 1,
                  scale: status === 'active' ? 1.05 : 1,
                }}
                className={`p-3 rounded-lg border transition-all ${
                  status === 'complete'
                    ? 'bg-green-500/10 border-green-500/30'
                    : status === 'active'
                    ? 'bg-purple-500/20 border-purple-500/50'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{agent.name}</span>
                  {status === 'complete' && <CheckCircle className="w-4 h-4 text-green-400" />}
                  {status === 'active' && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
                </div>
                <div className="text-xs text-gray-500 capitalize">{status}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // Complete state - show results
  if (result.status === 'complete' && result.sections) {
    if (result.type === 'executive-brief') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Executive Target Brief: {targetName}
            </h3>
            <button
              onClick={onReset}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← New Analysis
            </button>
          </div>

          {/* Overview */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-purple-500/20">
            <h4 className="text-sm font-medium text-purple-300 mb-2">Overview</h4>
            <p className="text-white">{result.sections.overview}</p>
          </div>

          {/* Key Findings */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Key Findings</h4>
            <ul className="space-y-2">
              {result.sections.keyFindings.map((finding: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-white">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  {finding}
                </li>
              ))}
            </ul>
          </div>

          {/* Risk Summary */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Risk Summary</h4>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(result.sections.riskSummary).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className={`text-lg font-semibold ${
                    value === 'Low' ? 'text-green-400' : value === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {value as string}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{key}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunity Score */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-green-300">Opportunity Score</h4>
              <div className="text-3xl font-bold text-green-400">{result.sections.opportunityScore}/10</div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Recommended Actions</h4>
            <ol className="space-y-2 list-decimal list-inside">
              {result.sections.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="text-sm text-white">{rec}</li>
              ))}
            </ol>
          </div>
        </div>
      );
    }

    // Investment Thesis Results
    if (result.type === 'investment-thesis') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Investment Thesis: {targetName}
            </h3>
            <button
              onClick={onReset}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← New Analysis
            </button>
          </div>

          {/* Thesis Statement */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-purple-500/20">
            <h4 className="text-sm font-medium text-purple-300 mb-2">Investment Thesis</h4>
            <p className="text-white">{result.sections.thesis}</p>
          </div>

          {/* Recommendation Badge */}
          <div className="flex items-center justify-center gap-4">
            <div className={`px-6 py-3 rounded-xl font-bold text-xl ${
              result.sections.recommendation === 'BUY'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {result.sections.recommendation}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{result.sections.confidenceScore}/10</div>
              <div className="text-xs text-gray-500">Confidence Score</div>
            </div>
          </div>

          {/* Bull/Bear Cases */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <h4 className="text-sm font-medium text-green-300 mb-3">Bull Case</h4>
              <ul className="space-y-2">
                {result.sections.bullCase.map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-white">
                    <span className="text-green-400">+</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <h4 className="text-sm font-medium text-red-300 mb-3">Bear Case</h4>
              <ul className="space-y-2">
                {result.sections.bearCase.map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-white">
                    <span className="text-red-400">-</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Valuation Range */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Valuation Range</h4>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-400">{result.sections.valuationRange.conservative}</div>
                <div className="text-xs text-gray-500">Conservative</div>
              </div>
              <div className="flex-1 mx-4 h-2 bg-gradient-to-r from-gray-600 via-purple-500 to-green-500 rounded-full" />
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-400">{result.sections.valuationRange.base}</div>
                <div className="text-xs text-gray-500">Base</div>
              </div>
              <div className="flex-1 mx-4 h-2 bg-gradient-to-r from-purple-500 to-green-500 rounded-full" />
              <div className="text-center">
                <div className="text-lg font-semibold text-green-400">{result.sections.valuationRange.optimistic}</div>
                <div className="text-xs text-gray-500">Optimistic</div>
              </div>
            </div>
          </div>

          {/* Comparable Deals */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Comparable Deals</h4>
            <div className="space-y-2">
              {result.sections.comparableDeals.map((deal: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                  <div>
                    <div className="text-sm text-white">{deal.target}</div>
                    <div className="text-xs text-gray-500">{deal.acquirer} • {deal.stage} • {deal.year}</div>
                  </div>
                  <div className="text-lg font-semibold text-green-400">{deal.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Risks Table */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Key Risks & Mitigants</h4>
            <div className="space-y-2">
              {result.sections.keyRisks.map((risk: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{risk.risk}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">{risk.probability}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        risk.impact === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>{risk.impact}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Mitigant: {risk.mitigant}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  }

  return null;
};

export default SonnyHeroInterface;

