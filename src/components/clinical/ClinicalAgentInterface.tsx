/**
 * Clinical Agent Interface Component
 * Comprehensive UI for clinical analysis with tabbed interface:
 * - Analyze tab: Target input, analysis modules
 * - Trials tab: Clinical trial search and monitoring
 * - Competitive tab: Competitive landscape analysis
 * - Diligence tab: BD/M&A due diligence assessment
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Search,
  Upload,
  FileText,
  BarChart3,
  Swords,
  ClipboardList,
  Clock,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Building2,
  BookOpen,
  Target,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Microscope,
  Users,
  Shield,
  Info,
  Sparkles,
  Send,
} from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';
import ClinicalDataSourcesSection from './ClinicalDataSourcesSection';
import ClinicalGenerateReportSection from './ClinicalGenerateReportSection';
import TrialDetailPanel from './TrialDetailPanel';
import TargetValidationPanel from './TargetValidationPanel';
import CompetitiveLandscapePanel from './CompetitiveLandscapePanel';
import DealMemoPanel from './DealMemoPanel';

interface ClinicalAgentInterfaceProps {
  onBackToChat?: () => void;
  className?: string;
}

type ClinicalTab = 'analyze' | 'trials' | 'competitive' | 'diligence';

export default function ClinicalAgentInterface({
  onBackToChat,
  className = '',
}: ClinicalAgentInterfaceProps) {
  const [activeTab, setActiveTab] = useState<ClinicalTab>('analyze');
  const [targetInput, setTargetInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    type: string;
    size: string;
    status: 'processing' | 'complete' | 'error';
  }>>([]);
  const [loadedTargets, setLoadedTargets] = useState<Array<{
    name: string;
    description: string;
    loaded: boolean;
  }>>([
    { name: 'TIGIT', description: 'Immuno-oncology checkpoint', loaded: true },
    { name: 'GLP-1R', description: 'Metabolic/obesity target', loaded: true },
  ]);
  const [activeDetailPanel, setActiveDetailPanel] = useState<'trial' | 'validation' | 'competitive' | 'deal' | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'agent'; content: string; timestamp: Date }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Listen for reset event from parent
  useEffect(() => {
    const handleReset = () => {
      setActiveDetailPanel(null);
      setActiveTab('analyze');
    };

    window.addEventListener('reset-clinical-interface', handleReset);
    return () => {
      window.removeEventListener('reset-clinical-interface', handleReset);
    };
  }, []);

  // Analysis modules
  const analysisModules = [
    { title: 'Genetic Validation', description: 'GWAS + Mendelian validation', icon: Target },
    { title: 'Clinical Trial Analysis', description: 'Trial data synthesis and interpretation', icon: BarChart3 },
    { title: 'Safety Profile', description: 'Adverse events and safety signals', icon: Shield },
    { title: 'Competitive Position', description: 'Market positioning analysis', icon: Swords },
    { title: 'PK/PD Assessment', description: 'Pharmacokinetics and dynamics', icon: Activity },
    { title: 'Biomarker Strategy', description: 'Biomarker identification and validation', icon: Microscope },
    { title: 'Regulatory Path', description: 'FDA pathways and approval timelines', icon: FileText },
    { title: 'Deal Thesis', description: 'BD/M&A investment thesis', icon: ClipboardList },
  ];

  // Recent analyses
  const recentAnalyses = [
    { name: 'KRAS G12C Analysis', date: 'Today' },
    { name: 'PD-1 Competitive', date: 'Yesterday' },
    { name: 'MASH Target Review', date: '2 days ago' },
  ];

  // Upcoming catalysts
  const upcomingCatalysts = [
    { nctNumber: 'NCT04294810', description: 'Phase 3 readout', drug: 'Semaglutide NASH', date: 'Dec 2024', priority: 'high' as const },
    { nctNumber: 'NCT05007106', description: 'Interim data', drug: 'KRAS G12C combo', date: 'Q1 2025', priority: 'medium' as const },
    { nctNumber: 'NCT05432623', description: 'Phase 2 results', drug: 'CD19 CAR-T solid', date: 'Q2 2025', priority: 'low' as const },
  ];

  // Validation items
  const validationItems = [
    { title: 'Human Genetics', description: 'GWAS + Mendelian validation', rating: 'strong' as const },
    { title: 'Disease Biology', description: 'Clear pathway, some gaps', rating: 'moderate' as const },
    { title: 'Clinical Precedent', description: 'Prior failures at target', rating: 'weak' as const },
    { title: 'MOA Clarity', description: 'Fuzzy downstream effects', rating: 'moderate' as const },
  ];

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map((file) => ({
      name: file.name,
      type: file.type || file.name.split('.').pop()?.toUpperCase() || 'Unknown',
      size: `${(file.size / 1024).toFixed(1)} KB`,
      status: 'processing' as const,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Process files
    for (const file of Array.from(files)) {
      try {
        // Validate file type
        const validTypes = ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-excel'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const isValidType = validTypes.includes(file.type) || ['pdf', 'csv', 'pptx', 'xlsx', 'doc', 'docx'].includes(fileExtension || '');

        if (!isValidType) {
          setUploadedFiles((prev) =>
            prev.map((f) => (f.name === file.name ? { ...f, status: 'error' as const } : f))
          );
          continue;
        }

        // Simulate file processing (extract target mentions, parse data, etc.)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Extract target mentions from filename/content (simulated)
        const targetMatches = file.name.match(/\b(TIGIT|KRAS|PD-1|PDL1|GLP-1|GLP1R|NASH|MASH)\b/gi);
        if (targetMatches && targetMatches.length > 0) {
          const targetName = targetMatches[0].toUpperCase();
          // Add to loaded targets if not already present
          setLoadedTargets((prev) => {
            if (!prev.some((t) => t.name === targetName)) {
              return [
                ...prev,
                {
                  name: targetName,
                  description: 'Loaded from uploaded file',
                  loaded: true,
                },
              ];
            }
            return prev;
          });
        }

        // Mark as complete
        setUploadedFiles((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, status: 'complete' as const } : f))
        );
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        setUploadedFiles((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, status: 'error' as const } : f))
        );
      }
    }
  }, []);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      handleFileUpload(files);
    },
    [handleFileUpload]
  );

  // Handle chat send
  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || isProcessing) return;

    const userMessage = {
      role: 'user' as const,
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsProcessing(true);

    try {
      // Get current target context
      const currentTarget = loadedTargets.length > 0 ? loadedTargets[0].name : undefined;
      
      const response = await fetch('/api/agents/clinical-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          documents: uploadedFiles.filter(f => f.status === 'complete').map((f) => ({ 
            fileName: f.name,
            name: f.name 
          })),
          target: currentTarget,
          analysisType: activeTab === 'analyze' ? 'target_analysis' : activeTab === 'trials' ? 'trial_analysis' : activeTab === 'competitive' ? 'competitive_analysis' : 'diligence',
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from clinical agent');
      }

      const data = await response.json();

      const agentMessage = {
        role: 'agent' as const,
        content: data.response || data.message || 'Analysis complete',
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, agentMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage = {
        role: 'agent' as const,
        content: `Error: ${err.message || 'Failed to get response from clinical agent'}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [chatInput, chatMessages, uploadedFiles, loadedTargets, activeTab, isProcessing]);

  // Handle key down for chat
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleChatSend();
      }
    },
    [handleChatSend]
  );

  const getRatingBadge = (rating: 'strong' | 'moderate' | 'weak') => {
    const config = {
      strong: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Strong' },
      moderate: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Moderate' },
      weak: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Weak' },
    };
    const c = config[rating];
    return (
      <span className={`px-2 py-0.5 ${c.bg} ${c.text} text-xs font-medium rounded-full`}>
        {c.label}
      </span>
    );
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'border-l-red-500',
      medium: 'border-l-amber-500',
      low: 'border-l-emerald-500',
    };
    return colors[priority];
  };

  return (
    <div className={`flex flex-col flex-1 w-full relative ${className}`}>
      {/* Main Interface - Show when no detail panel is active */}
      {!activeDetailPanel && (
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Header - Only show if onBackToChat is provided (meaning we're in analysis view, not tabbed interface) */}
          {onBackToChat && (
            <div className="p-4 border-b border-white/10">
              {/* Back Button - Only show when in detail panel view, not in main tabbed interface */}
              {activeDetailPanel && (
                <button
                  onClick={onBackToChat}
                  className="flex items-center gap-2 text-sm text-textSecondary hover:text-textPrimary mb-3 transition-colors"
                >
                  <ChevronLeft size={16} />
                  Back to Clinical Analyst
                </button>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Activity size={20} className="text-purple-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-textPrimary">Clinical Analyst</h2>
                  <p className="text-xs text-textSecondary">Target & trial intelligence</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation - Match Patent/Financial Agent styling exactly */}
          {onBackToChat ? (
            <div className="px-6 pt-4">
              <div className="mb-4 flex gap-1 p-1 bg-surfaceElevated rounded-lg overflow-x-auto">
                {[
                  { id: 'analyze' as const, label: 'Analyze', icon: Search },
                  { id: 'trials' as const, label: 'Trials', icon: BarChart3 },
                  { id: 'competitive' as const, label: 'Competitive', icon: Swords },
                  { id: 'diligence' as const, label: 'Diligence', icon: ClipboardList },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-w-0 ${
                        activeTab === tab.id
                          ? 'bg-surface text-purple-400 shadow-sm'
                          : 'text-textSecondary hover:text-textPrimary'
                      }`}
                    >
                      <TabIcon size={14} className="flex-shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-4 px-6 flex gap-1 p-1 bg-surfaceElevated rounded-lg overflow-x-auto">
              {[
                { id: 'analyze' as const, label: 'Analyze', icon: Search },
                { id: 'trials' as const, label: 'Trials', icon: BarChart3 },
                { id: 'competitive' as const, label: 'Competitive', icon: Swords },
                { id: 'diligence' as const, label: 'Diligence', icon: ClipboardList },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-w-0 ${
                      activeTab === tab.id
                        ? 'bg-surface text-purple-400 shadow-sm'
                        : 'text-textSecondary hover:text-textPrimary'
                    }`}
                  >
                    <TabIcon size={14} className="flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab Content - Match Patent/Financial Agent spacing */}
          <div className={`flex-1 overflow-y-auto space-y-4 ${onBackToChat ? 'px-6 pb-4' : ''}`}>
            {activeTab === 'analyze' && (
              <>
                {/* Target Input Section */}
                <CollapsibleSection
                  title="Target Input"
                  icon={Upload}
                  defaultOpen={true}
                >
                  <div className="space-y-3">
                    {/* Drop Zone */}
                    <div
                      ref={dropZoneRef}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                        isDragging
                          ? 'border-purple-500/50 bg-purple-500/10'
                          : 'border-white/20 hover:border-white/30 bg-surfaceElevated'
                      }`}
                    >
                      <Upload size={24} className="mx-auto text-textTertiary mb-2" />
                      <p className="text-sm font-medium text-textPrimary mb-1">Drop clinical data files here</p>
                      <p className="text-xs text-textSecondary">PDF, CSV, PPTX, SEC filings</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.csv,.pptx,.xlsx,.doc,.docx"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-400 hover:bg-purple-500/30 transition-colors"
                      >
                        Browse Files
                      </button>
                    </div>

                    {/* File Type Chips */}
                    <div className="flex flex-wrap gap-2">
                      {['PDF', 'CSV', 'SEC', 'PPTX'].map((type) => (
                        <span
                          key={type}
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            type === 'PDF'
                              ? 'text-purple-400 bg-purple-500/20'
                              : 'text-textSecondary bg-surfaceElevated'
                          }`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-wide">Uploaded Documents</h4>
                        {uploadedFiles.map((file, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-4 bg-surfaceElevated rounded-xl border border-white/10 hover:border-purple-500/30 cursor-pointer transition-colors"
                          >
                            <FileText size={16} className="text-purple-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-textPrimary truncate">{file.name}</p>
                              <p className="text-xs text-textSecondary">{file.type} • {file.size}</p>
                            </div>
                            {file.status === 'processing' && (
                              <Loader2 size={16} className="text-purple-400 animate-spin" />
                            )}
                            {file.status === 'complete' && (
                              <CheckCircle2 size={16} className="text-emerald-400" />
                            )}
                            {file.status === 'error' && (
                              <XCircle size={16} className="text-red-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Target Search */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={targetInput}
                        onChange={(e) => setTargetInput(e.target.value)}
                        placeholder="Enter target (e.g., TIGIT, KRAS)"
                        className="flex-1 px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                      />
                      <button
                        onClick={() => {
                          if (targetInput.trim()) {
                            setLoadedTargets((prev) => {
                              if (!prev.some((t) => t.name.toUpperCase() === targetInput.toUpperCase())) {
                                return [
                                  ...prev,
                                  {
                                    name: targetInput.toUpperCase(),
                                    description: 'User-entered target',
                                    loaded: true,
                                  },
                                ];
                              }
                              return prev;
                            });
                            setTargetInput('');
                          }
                        }}
                        className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
                      >
                        <Search size={16} />
                        Fetch
                      </button>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Loaded Targets */}
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-wide">Loaded Targets</h4>
                  {loadedTargets.map((target, i) => (
                    <div
                      key={i}
                      className={`p-4 bg-surfaceElevated border rounded-xl ${
                        target.loaded ? 'border-purple-500/30' : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <FileText size={16} className="text-textTertiary mt-0.5" />
                          <div>
                            <p className="font-medium text-textPrimary">{target.name}</p>
                            <p className="text-sm text-textSecondary">{target.description}</p>
                          </div>
                        </div>
                        {target.loaded && <CheckCircle2 size={20} className="text-emerald-400" />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Analysis Modules */}
                <div className="mt-4 pt-4 border-t border-white/10">
                <CollapsibleSection
                  title="Analysis Modules"
                  icon={BarChart3}
                  defaultOpen={true}
                  count={8}
                >
                  <div className="space-y-2">
                    {analysisModules.map((module, i) => {
                      const Icon = module.icon;
                      // Map modules to detail panels
                      const getDetailPanel = (title: string): 'trial' | 'validation' | 'competitive' | 'deal' | null => {
                        if (title === 'Clinical Trial Analysis') return 'trial';
                        if (title === 'Genetic Validation') return 'validation';
                        if (title === 'Competitive Position') return 'competitive';
                        if (title === 'Deal Thesis') return 'deal';
                        return null;
                      };
                      const detailPanel = getDetailPanel(module.title);
                      return (
                        <button
                          key={i}
                          onClick={async () => {
                            if (detailPanel) {
                              setActiveDetailPanel(detailPanel);
                            } else {
                              // Trigger analysis for other modules
                              setIsProcessing(true);
                              try {
                                const currentTarget = loadedTargets.length > 0 ? loadedTargets[0].name : undefined;
                                const response = await fetch('/api/agents/clinical-analyst', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    messages: [{
                                      role: 'user',
                                      content: `Analyze ${module.title.toLowerCase()} for ${currentTarget || 'the target'}. ${module.description}`,
                                    }],
                                    documents: uploadedFiles.filter(f => f.status === 'complete').map((f) => ({ 
                                      fileName: f.name,
                                      name: f.name 
                                    })),
                                    target: currentTarget,
                                    analysisType: module.title.toLowerCase().replace(/\s+/g, '_'),
                                  }),
                                  credentials: 'include',
                                });

                                if (response.ok) {
                                  const data = await response.json();
                                  // Add analysis result to chat
                                  setChatMessages((prev) => [...prev, {
                                    role: 'agent',
                                    content: `## ${module.title}\n\n${data.response || data.message}`,
                                    timestamp: new Date(),
                                  }]);
                                }
                              } catch (err) {
                                console.error('Analysis error:', err);
                              } finally {
                                setIsProcessing(false);
                              }
                            }
                          }}
                          className="w-full p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-purple-500/50 hover:shadow-md transition-all text-left group relative overflow-visible"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                              <Icon size={20} className="text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-textPrimary text-sm">{module.title}</h4>
                                <ChevronRight size={16} className="text-textSecondary group-hover:text-purple-400 transition-colors" />
                              </div>
                              <p className="text-xs text-textSecondary mt-1 line-clamp-2">{module.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleSection>
                </div>

                {/* Recent Analyses */}
                <div className="mt-4 pt-4 border-t border-white/10">
                <CollapsibleSection
                  title="Recent Analyses"
                  icon={Clock}
                  defaultOpen={false}
                  count={5}
                >
                  <div className="space-y-2">
                    {recentAnalyses.map((analysis, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-2 hover:bg-surface rounded-lg transition-colors"
                      >
                        <p className="text-sm font-medium text-textPrimary">{analysis.name}</p>
                        <p className="text-xs text-textSecondary">{analysis.date}</p>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>
                </div>
              </>
            )}

            {activeTab === 'trials' && (
              <>
                {/* Trial Search */}
                <CollapsibleSection
                  title="Trial Search"
                  icon={Search}
                  defaultOpen={true}
                >
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by target, drug, indication..."
                      className="w-full px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                    <div className="flex gap-2">
                      <select className="flex-1 px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                        <option>All Phases</option>
                        <option>Phase 1</option>
                        <option>Phase 2</option>
                        <option>Phase 3</option>
                      </select>
                      <select className="flex-1 px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                        <option>All Indications</option>
                        <option>Oncology</option>
                        <option>Metabolic</option>
                        <option>CNS</option>
                      </select>
                    </div>
                    <button
                      onClick={async () => {
                        if (!searchQuery.trim()) return;
                        setIsProcessing(true);
                        try {
                          const response = await fetch('/api/agents/clinical-analyst', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              messages: [{
                                role: 'user',
                                content: `Search for clinical trials: ${searchQuery}`,
                              }],
                              analysisType: 'trial_search',
                              context: `Search query: ${searchQuery}`,
                            }),
                            credentials: 'include',
                          });

                          if (response.ok) {
                            const data = await response.json();
                            setChatMessages((prev) => [...prev, {
                              role: 'agent',
                              content: `## Clinical Trial Search Results\n\n${data.response || data.message}`,
                              timestamp: new Date(),
                            }]);
                          }
                        } catch (err) {
                          console.error('Trial search error:', err);
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      className="w-full py-2.5 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!searchQuery.trim() || isProcessing}
                    >
                      <Search size={16} />
                      Search Clinical Trials
                    </button>
                  </div>
                </CollapsibleSection>

                {/* Active Monitoring */}
                <div className="mt-4 pt-4 border-t border-white/10">
                <CollapsibleSection
                  title="Active Monitoring"
                  icon={Activity}
                  defaultOpen={false}
                  count={12}
                >
                  <div className="p-2">
                    <p className="text-sm text-textSecondary px-3 py-2">
                      Tracking trials with upcoming readouts
                    </p>
                  </div>
                </CollapsibleSection>
                </div>

                {/* Upcoming Catalysts */}
                <div className="mt-4 pt-4 border-t border-white/10">
                <CollapsibleSection
                  title="Upcoming Catalysts"
                  icon={Calendar}
                  defaultOpen={true}
                >
                  <div className="space-y-2">
                    {upcomingCatalysts.map((catalyst, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveDetailPanel('trial')}
                        className={`w-full p-4 bg-surfaceElevated border-l-4 ${getPriorityColor(catalyst.priority)} rounded-xl hover:border-purple-500/50 hover:shadow-md transition-all text-left`}
                      >
                        <p className="font-medium text-textPrimary text-sm">{catalyst.nctNumber} - {catalyst.description}</p>
                        <p className="text-xs text-textSecondary mt-1">{catalyst.drug} │ {catalyst.date}</p>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>
                </div>
              </>
            )}

            {activeTab === 'competitive' && (
              <>
                {/* Landscape Search */}
                <CollapsibleSection
                  title="Landscape Search"
                  icon={Search}
                  defaultOpen={true}
                >
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Search by target, indication..."
                      className="w-full px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                    <div className="flex gap-2">
                      <select className="flex-1 px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                        <option>All Modalities</option>
                        <option>Small Molecule</option>
                        <option>Antibody</option>
                        <option>Cell Therapy</option>
                      </select>
                      <select className="flex-1 px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                        <option>All Stages</option>
                        <option>Preclinical</option>
                        <option>Phase 1-2</option>
                        <option>Phase 3+</option>
                      </select>
                    </div>
                    <button
                      onClick={async () => {
                        setIsProcessing(true);
                        try {
                          const response = await fetch('/api/agents/clinical-analyst', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              messages: [{
                                role: 'user',
                                content: 'Analyze competitive landscape for the current target',
                              }],
                              target: loadedTargets.length > 0 ? loadedTargets[0].name : undefined,
                              analysisType: 'competitive_landscape',
                            }),
                            credentials: 'include',
                          });

                          if (response.ok) {
                            const data = await response.json();
                            setChatMessages((prev) => [...prev, {
                              role: 'agent',
                              content: `## Competitive Landscape Analysis\n\n${data.response || data.message}`,
                              timestamp: new Date(),
                            }]);
                            // Optionally open competitive landscape panel
                            setActiveDetailPanel('competitive');
                          }
                        } catch (err) {
                          console.error('Competitive analysis error:', err);
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      className="w-full py-2.5 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isProcessing}
                    >
                      <Search size={16} />
                      Search Competitive Intel
                    </button>
                  </div>
                </CollapsibleSection>

                {/* Saved Landscapes */}
                <div className="mt-4 pt-4 border-t border-white/10">
                <CollapsibleSection
                  title="PD-1/PD-L1 Landscape"
                  icon={FileText}
                  defaultOpen={false}
                  count={8}
                >
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => setActiveDetailPanel('competitive')}
                      className="w-full text-left px-3 py-2 hover:bg-surface rounded-lg transition-colors"
                    >
                      <p className="text-sm text-textSecondary">8 active programs tracked</p>
                    </button>
                  </div>
                </CollapsibleSection>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                <CollapsibleSection
                  title="GLP-1 RA Landscape"
                  icon={FileText}
                  defaultOpen={false}
                  count={12}
                >
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => setActiveDetailPanel('competitive')}
                      className="w-full text-left px-3 py-2 hover:bg-surface rounded-lg transition-colors"
                    >
                      <p className="text-sm text-textSecondary">12 programs across obesity/diabetes</p>
                    </button>
                  </div>
                </CollapsibleSection>
                </div>
              </>
            )}

            {activeTab === 'diligence' && (
              <>
                {/* Diligence Assessment */}
                <CollapsibleSection
                  title="Diligence Assessment"
                  icon={ClipboardList}
                  defaultOpen={false}
                >
                  <div className="p-2">
                    <button
                      onClick={async () => {
                        if (loadedTargets.length === 0) {
                          setChatMessages((prev) => [...prev, {
                            role: 'agent',
                            content: 'Please load a target first before running diligence assessment.',
                            timestamp: new Date(),
                          }]);
                          return;
                        }
                        setIsProcessing(true);
                        try {
                          const response = await fetch('/api/agents/clinical-analyst', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              messages: [{
                                role: 'user',
                                content: `Run comprehensive BD/M&A diligence assessment for ${loadedTargets[0].name}, including target validation, risk assessment, and PTS calculation.`,
                              }],
                              target: loadedTargets[0].name,
                              analysisType: 'diligence_assessment',
                              documents: uploadedFiles.filter(f => f.status === 'complete').map((f) => ({ 
                                fileName: f.name,
                                name: f.name 
                              })),
                            }),
                            credentials: 'include',
                          });

                          if (response.ok) {
                            const data = await response.json();
                            setChatMessages((prev) => [...prev, {
                              role: 'agent',
                              content: `## Diligence Assessment: ${loadedTargets[0].name}\n\n${data.response || data.message}`,
                              timestamp: new Date(),
                            }]);
                          }
                        } catch (err) {
                          console.error('Diligence assessment error:', err);
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-surface rounded-lg transition-colors text-sm text-textSecondary hover:text-textPrimary"
                    >
                      Run comprehensive BD/M&A analysis
                    </button>
                  </div>
                </CollapsibleSection>

                {/* Target Validation */}
                <div className="mt-4 pt-4 border-t border-white/10">
                <CollapsibleSection
                  title="Target Validation"
                  icon={AlertTriangle}
                  defaultOpen={true}
                  count={4}
                  badge={{ text: '2 Weak', color: 'bg-red-500/20 text-red-400' }}
                >
                  <div className="space-y-1 border border-white/10 rounded-lg overflow-hidden">
                    {validationItems.map((item, i) => (
                      <button
                        key={i}
                        onClick={async () => {
                          setActiveDetailPanel('validation');
                          // Also trigger analysis for this validation item
                          if (loadedTargets.length > 0) {
                            setIsProcessing(true);
                            try {
                              const response = await fetch('/api/agents/clinical-analyst', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  messages: [{
                                    role: 'user',
                                    content: `Analyze ${item.title.toLowerCase()} for ${loadedTargets[0].name}. ${item.description}`,
                                  }],
                                  target: loadedTargets[0].name,
                                  analysisType: 'target_validation',
                                  context: `Validation aspect: ${item.title}`,
                                }),
                                credentials: 'include',
                              });

                              if (response.ok) {
                                const data = await response.json();
                                setChatMessages((prev) => [...prev, {
                                  role: 'agent',
                                  content: `## ${item.title} Analysis\n\n${data.response || data.message}`,
                                  timestamp: new Date(),
                                }]);
                              }
                            } catch (err) {
                              console.error('Validation analysis error:', err);
                            } finally {
                              setIsProcessing(false);
                            }
                          }
                        }}
                        className="w-full p-4 bg-surfaceElevated border-l-4 border-l-transparent hover:border-l-purple-500 transition-colors text-left"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-textPrimary text-sm">{item.title}</p>
                            <p className="text-xs text-textSecondary mt-1">{item.description}</p>
                          </div>
                          {getRatingBadge(item.rating)}
                        </div>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>
                </div>

                {/* Key Risks */}
                <div className="mt-4 pt-4 border-t border-white/10">
                <CollapsibleSection
                  title="Key Risks"
                  icon={AlertTriangle}
                  defaultOpen={false}
                  count={3}
                >
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-sm text-textPrimary">Mechanism failure (High)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-sm text-textPrimary">Competitive timing (Medium)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm text-textPrimary">Regulatory path (Low)</span>
                    </div>
                  </div>
                </CollapsibleSection>
                </div>

                {/* PTS Calculator */}
                <div className="mt-4 pt-4 border-t border-white/10">
                <div className="border border-white/10 rounded-xl overflow-hidden bg-surfaceElevated">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp size={16} className="text-purple-400" />
                      <span className="font-medium text-textPrimary text-sm">PTS Estimate</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-surface rounded-lg text-center">
                        <p className="text-xs text-textSecondary mb-1">Baseline</p>
                        <p className="text-2xl font-bold text-textPrimary">15%</p>
                        <p className="text-xs text-textSecondary">(Phase 2)</p>
                      </div>
                      <div className="p-3 bg-purple-500/20 rounded-lg text-center">
                        <p className="text-xs text-textSecondary mb-1">Adjusted PTS</p>
                        <p className="text-2xl font-bold text-purple-400">22%</p>
                        <p className="text-xs text-emerald-400">↑7% vs baseline</p>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </>
            )}
          </div>

          {/* Data Sources & Generate Report - Match Patent/Financial Agent spacing with dividers */}
          <div className={`space-y-4 ${onBackToChat ? 'px-6' : ''}`}>
            <ClinicalDataSourcesSection
              defaultOpen={false}
              onConfigure={() => {
                console.log('Configure data sources');
              }}
            />
            <ClinicalGenerateReportSection
              defaultOpen={false}
              onGenerate={(reportType) => {
                console.log('Generate report:', reportType);
              }}
              target={loadedTargets.length > 0 ? loadedTargets[0].name : undefined}
              documents={uploadedFiles.filter(f => f.status === 'complete').map((f) => ({ name: f.name }))}
            />
          </div>

          {/* Chat Messages Display */}
          {chatMessages.length > 0 && (
            <div className={`border-t border-white/10 ${onBackToChat ? 'px-6 py-4' : 'px-6 py-4'}`}>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-purple-500/20 text-textPrimary'
                          : 'bg-surfaceElevated text-textPrimary border border-white/10'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs text-textTertiary mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input at Bottom - Padding matches parent container when in tabbed view */}
          <div className={`border-t border-white/10 bg-surfaceElevated ${onBackToChat ? 'p-4' : 'p-6'}`}>
            <div className="relative mb-3">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-textTertiary pointer-events-none" />
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about clinical trials, safety, efficacy, or targets..."
                className="w-full pl-12 pr-4 py-3 bg-surface border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-purple-500/50 resize-none"
                rows={3}
                disabled={isProcessing}
              />
            </div>
            <button
              onClick={handleChatSend}
              disabled={!chatInput.trim() || isProcessing}
              className="w-full py-3 bg-purple-500 text-white rounded-lg font-semibold text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Send
                </>
              )}
            </button>
            <p className={`text-xs text-textTertiary mt-2 text-center ${onBackToChat ? '' : 'px-0'}`}>
              Press ⌘+Enter or Ctrl+Enter to send
            </p>
          </div>
        </div>
      )}

      {/* Detail Panels */}
      <AnimatePresence>
        {activeDetailPanel === 'trial' && (
          <TrialDetailPanel
            trial={undefined}
            onClose={() => setActiveDetailPanel(null)}
          />
        )}
        {activeDetailPanel === 'validation' && (
          <TargetValidationPanel
            target={undefined}
            onClose={() => setActiveDetailPanel(null)}
          />
        )}
        {activeDetailPanel === 'competitive' && (
          <CompetitiveLandscapePanel
            landscape={undefined}
            onClose={() => setActiveDetailPanel(null)}
          />
        )}
        {activeDetailPanel === 'deal' && (
          <DealMemoPanel
            deal={undefined}
            onClose={() => setActiveDetailPanel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
