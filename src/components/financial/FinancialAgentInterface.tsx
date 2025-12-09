/**
 * Financial Agent Interface Component
 * Comprehensive UI for financial analysis with tabbed interface:
 * - Analyze tab: Documents, Quick Actions, Valuation modules
 * - Models tab: Model templates and saved models
 * - Deals tab: Deal workflow and transaction database
 * - Monitor tab: Watchlist and alerts
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  FileText,
  Upload,
  Calculator,
  PieChart,
  BarChart3,
  Target,
  AlertTriangle,
  Building2,
  Briefcase,
  Scale,
  GitBranch,
  Clock,
  Users,
  Shield,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  FileSpreadsheet,
  File,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Database,
  Globe,
  Landmark,
  Receipt,
  Wallet,
  LineChart,
  Activity,
  BookOpen,
  Layers,
  Zap,
  Settings,
  Info,
  X,
  Play,
  Download,
  Send,
  Sparkles,
} from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';
import DocumentAnalysisPanel from './DocumentAnalysisPanel';
import RNPVCalculatorPanel from './RNPVCalculatorPanel';
import ComparableCompaniesPanel from './ComparableCompaniesPanel';
import FinancialDataSourcesSection from './FinancialDataSourcesSection';
import FinancialGenerateReportSection from './FinancialGenerateReportSection';

interface FinancialAgentInterfaceProps {
  onBackToChat?: () => void;
  className?: string;
}

type FinancialTab = 'analyze' | 'models' | 'deals' | 'monitor';

export default function FinancialAgentInterface({
  onBackToChat,
  className = '',
}: FinancialAgentInterfaceProps) {
  const [activeTab, setActiveTab] = useState<FinancialTab>('analyze');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    type: string;
    size: string;
    status: 'processing' | 'complete' | 'error';
  }>>([]);
  const [activeDetailPanel, setActiveDetailPanel] = useState<'document' | 'rnpv' | 'comps' | null>(null);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'agent'; content: string; timestamp: Date }>>([]);
  const [chatInput, setChatInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Listen for reset event from parent
  useEffect(() => {
    const handleReset = () => {
      setActiveDetailPanel(null);
      setActiveTab('analyze');
    };

    window.addEventListener('reset-financial-interface', handleReset);
    return () => {
      window.removeEventListener('reset-financial-interface', handleReset);
    };
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map((file) => ({
      name: file.name,
      type: file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'Excel Model' : 
            file.name.includes('10-K') ? '10-K Filing' :
            file.name.includes('10-Q') ? '10-Q Filing' :
            file.name.includes('S-1') ? 'S-1 Filing' : 'PDF',
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      status: 'processing' as const,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Simulate processing
    setTimeout(() => {
      setUploadedFiles((prev) =>
        prev.map((f) => (newFiles.some((nf) => nf.name === f.name) ? { ...f, status: 'complete' as const } : f))
      );
    }, 2000);
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  // Handle chat send
  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim()) return;

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
      const response = await fetch('/api/agents/financial-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          documents: uploadedFiles.length > 0 ? uploadedFiles.map((f) => ({ fileName: f.name })) : undefined,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from financial agent');
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
        content: `Error: ${err.message || 'Failed to get response from financial agent'}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [chatInput, chatMessages, uploadedFiles]);

  // Handle key down for chat
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleChatSend();
    }
  }, [handleChatSend]);

  // Valuation modules
  const valuationModules = [
    {
      icon: Calculator,
      title: 'DCF / rNPV Analysis',
      description: 'Risk-adjusted net present value with probability-weighted scenarios',
      tags: ['Core Valuation', 'Phase-adjusted'],
      onClick: () => setActiveDetailPanel('rnpv'),
    },
    {
      icon: Building2,
      title: 'Comparable Companies',
      description: 'Trading multiples analysis with stage and modality matching',
      tags: ['EV/Sales', 'EV/Peak'],
      onClick: () => setActiveDetailPanel('comps'),
    },
    {
      icon: Scale,
      title: 'Comparable Transactions',
      description: 'M&A and licensing deal benchmarks with premium analysis',
      tags: ['Precedents', 'Premiums'],
      onClick: () => {
        // TODO: Open comparable transactions panel
        console.log('Open comparable transactions');
      },
    },
    {
      icon: Layers,
      title: 'Sum-of-Parts (SOTP)',
      description: 'Pipeline valuation with platform optionality premium',
      tags: ['Pipeline', 'Platform'],
      isNew: true,
      onClick: () => {
        // TODO: Open SOTP panel
        console.log('Open SOTP analysis');
      },
    },
  ];

  // Deal modules
  const dealModules = [
    {
      icon: Briefcase,
      title: 'M&A Deal Structuring',
      description: 'Upfront, milestones, royalties optimization with walk-away analysis',
      tags: ['Structure', 'Negotiation'],
    },
    {
      icon: GitBranch,
      title: 'Licensing Economics',
      description: 'Co-development, profit-share, territory splits analysis',
      tags: ['BD Deals', 'Licensing'],
    },
    {
      icon: Receipt,
      title: 'Accretion / Dilution',
      description: 'Pro forma EPS impact and synergy realization timeline',
      tags: ['M&A Impact', 'Synergies'],
    },
    {
      icon: Shield,
      title: 'Fairness Opinion',
      description: 'Board-ready valuation range with fiduciary considerations',
      tags: ['Governance', 'Fiduciary'],
      isPremium: true,
    },
  ];

  // Financial health modules
  const financialHealthModules = [
    {
      icon: Wallet,
      title: 'Burn Rate & Runway',
      description: 'Cash runway scenarios with financing strategy recommendations',
      tags: ['Cash', 'Survival'],
    },
    {
      icon: TrendingUp,
      title: 'Capital Structure',
      description: 'Debt capacity, convert analysis, warrant dilution modeling',
      tags: ['Financing', 'Dilution'],
    },
    {
      icon: PieChart,
      title: 'Quality of Earnings',
      description: 'GAAP vs non-GAAP reconciliation, SBC impact, accrual analysis',
      tags: ['Accounting', 'QoE'],
    },
    {
      icon: AlertTriangle,
      title: 'Red Flag Detection',
      description: 'Automated screening for financial and governance concerns',
      tags: ['Risk', 'Screening'],
      isNew: true,
    },
  ];

  // Advanced modules
  const advancedModules = [
    {
      icon: LineChart,
      title: 'Sensitivity Analysis',
      description: 'Tornado charts and Monte Carlo simulation for key drivers',
      tags: ['Scenarios', 'Monte Carlo'],
    },
    {
      icon: Target,
      title: 'Real Options Valuation',
      description: 'Decision tree and Black-Scholes for platform optionality',
      tags: ['Options', 'Optionality'],
      isPremium: true,
    },
    {
      icon: Globe,
      title: 'FX & Tax Analysis',
      description: 'Multi-currency modeling, NOL valuation, transfer pricing',
      tags: ['International', 'Tax'],
    },
    {
      icon: Users,
      title: 'Activist Vulnerability',
      description: 'Shareholder base analysis and proxy fight economics',
      tags: ['Activists', 'Governance'],
    },
  ];

  return (
    <div className={`flex flex-col flex-1 w-full ${className}`}>
      {/* Detail Panels - Show when active */}
      {activeDetailPanel === 'document' && (
        <DocumentAnalysisPanel
          document={uploadedFiles[0] || null}
          onBack={() => setActiveDetailPanel(null)}
          onAnalyze={(options) => {
            // TODO: Trigger document analysis
            console.log('Analyze document with options:', options);
          }}
        />
      )}

      {activeDetailPanel === 'rnpv' && (
        <RNPVCalculatorPanel
          onBack={() => setActiveDetailPanel(null)}
          onCalculate={(inputs) => {
            // TODO: Calculate rNPV
            console.log('Calculate rNPV with inputs:', inputs);
          }}
        />
      )}

      {activeDetailPanel === 'comps' && (
        <ComparableCompaniesPanel
          onBack={() => setActiveDetailPanel(null)}
          onApply={(comps) => {
            // TODO: Apply comps to valuation
            console.log('Apply comps:', comps);
          }}
        />
      )}

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
                  Back to Financial Analyst
                </button>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign size={20} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-textPrimary">Financial Analyst</h2>
                  <p className="text-xs text-textSecondary">Institutional-grade biotech valuation</p>
                </div>
              </div>

              {/* Company Search */}
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textTertiary" />
                <input
                  type="text"
                  placeholder="Search company or ticker..."
                  value={selectedCompany || ''}
                  onChange={(e) => setSelectedCompany(e.target.value || null)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent"
                />
              </div>

              {/* Selected Company Badge */}
              {selectedCompany && (
                <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                  <Building2 size={16} className="text-green-400" />
                  <span className="text-sm font-medium text-textPrimary flex-1">{selectedCompany}</span>
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="text-textSecondary hover:text-textPrimary transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab Navigation - Match Patent Agent styling exactly (no extra wrapper, direct in flow) */}
          {onBackToChat ? (
            <div className="px-6 pt-4">
              <div className="mb-4 flex gap-1 p-1 bg-surfaceElevated rounded-lg overflow-x-auto">
                {[
                  { id: 'analyze' as const, label: 'Analyze', icon: BarChart3 },
                  { id: 'models' as const, label: 'Models', icon: Calculator },
                  { id: 'deals' as const, label: 'Deals', icon: Briefcase },
                  { id: 'monitor' as const, label: 'Monitor', icon: Activity },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-w-0 ${
                        activeTab === tab.id
                          ? 'bg-surface text-green-400 shadow-sm'
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
                { id: 'analyze' as const, label: 'Analyze', icon: BarChart3 },
                { id: 'models' as const, label: 'Models', icon: Calculator },
                { id: 'deals' as const, label: 'Deals', icon: Briefcase },
                { id: 'monitor' as const, label: 'Monitor', icon: Activity },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-w-0 ${
                      activeTab === tab.id
                        ? 'bg-surface text-green-400 shadow-sm'
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

          {/* Tab Content - Match Patent Agent spacing (px-6 for content sections only when in analysis view) */}
          <div className={`flex-1 overflow-y-auto space-y-4 ${onBackToChat ? 'px-6 pb-4' : ''}`}>
            {activeTab === 'analyze' && (
              <>
                {/* Documents Section */}
                <CollapsibleSection
                  title="Documents"
                  icon={Upload}
                  defaultOpen={true}
                  count={uploadedFiles.length}
                >
                  <div
                    ref={dropZoneRef}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      isDragging
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-white/20 hover:border-white/30 bg-surfaceElevated'
                    }`}
                  >
                    <Upload size={24} className="mx-auto text-textTertiary mb-2" />
                    <p className="text-sm font-medium text-textPrimary mb-1">Drop files here or click to upload</p>
                    <p className="text-xs text-textSecondary">SEC filings, Excel models, financial documents</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.xlsx,.xls,.csv,.doc,.docx"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 hover:bg-green-500/30 transition-colors"
                    >
                      Browse Files
                    </button>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-wide">Uploaded Documents</h4>
                      {uploadedFiles.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 bg-surfaceElevated rounded-lg border border-white/10 hover:border-green-500/30 cursor-pointer transition-colors"
                          onClick={() => setActiveDetailPanel('document')}
                        >
                          <FileText size={16} className="text-green-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-textPrimary truncate">{file.name}</p>
                            <p className="text-xs text-textSecondary">{file.type} • {file.size}</p>
                          </div>
                          {file.status === 'processing' && (
                            <Loader2 size={16} className="text-green-400 animate-spin" />
                          )}
                          {file.status === 'complete' && (
                            <CheckCircle2 size={16} className="text-green-400" />
                          )}
                          {file.status === 'error' && (
                            <XCircle size={16} className="text-danger" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleSection>

                {/* Quick Actions - Match Patent Agent tile sizing */}
                <CollapsibleSection
                  title="Quick Actions"
                  icon={Zap}
                  defaultOpen={true}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveDetailPanel('rnpv')}
                      className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl hover:border-green-500/50 hover:bg-green-500/30 transition-colors text-center"
                    >
                      <Calculator size={20} className="text-green-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-textPrimary">Quick rNPV</p>
                    </button>
                    <button
                      onClick={() => setActiveDetailPanel('comps')}
                      className="p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-green-500/50 transition-colors text-center"
                    >
                      <Building2 size={20} className="text-textSecondary mx-auto mb-2" />
                      <p className="text-sm font-semibold text-textPrimary">Find Comps</p>
                    </button>
                    <button
                      className="p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-green-500/50 transition-colors text-center"
                    >
                      <Wallet size={20} className="text-textSecondary mx-auto mb-2" />
                      <p className="text-sm font-semibold text-textPrimary">Runway Check</p>
                    </button>
                    <button
                      className="p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-green-500/50 transition-colors text-center"
                    >
                      <TrendingUp size={20} className="text-textSecondary mx-auto mb-2" />
                      <p className="text-sm font-semibold text-textPrimary">Cap Table</p>
                    </button>
                  </div>
                </CollapsibleSection>

                {/* Valuation Analysis */}
                <CollapsibleSection
                  title="Valuation Analysis"
                  icon={Calculator}
                  defaultOpen={true}
                  count={4}
                >
                  <div className="space-y-2">
                    {valuationModules.map((module, i) => {
                      const Icon = module.icon;
                      return (
                        <button
                          key={i}
                          onClick={module.onClick}
                          className="w-full p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-green-500/50 hover:shadow-md transition-all text-left group relative overflow-visible"
                        >
                          {module.isNew && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full z-10">
                              New
                            </span>
                          )}
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                              <Icon size={20} className="text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-textPrimary text-sm">{module.title}</h4>
                                <ChevronRight size={16} className="text-textSecondary group-hover:text-green-400 transition-colors" />
                              </div>
                              <p className="text-xs text-textSecondary mt-1 line-clamp-2">{module.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {module.tags.map((tag, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleSection>

                {/* Deal Analysis */}
                <CollapsibleSection
                  title="Deal Analysis"
                  icon={Briefcase}
                  defaultOpen={true}
                  count={4}
                >
                  <div className="space-y-2">
                    {dealModules.map((module, i) => {
                      const Icon = module.icon;
                      return (
                        <button
                          key={i}
                          className="w-full p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-green-500/50 hover:shadow-md transition-all text-left group relative overflow-visible"
                        >
                          {module.isPremium && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 bg-warning text-white text-xs font-medium rounded-full z-10 flex items-center gap-1">
                              <Sparkles size={10} /> Pro
                            </span>
                          )}
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                              <Icon size={20} className="text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-textPrimary text-sm">{module.title}</h4>
                                <ChevronRight size={16} className="text-textSecondary group-hover:text-green-400 transition-colors" />
                              </div>
                              <p className="text-xs text-textSecondary mt-1 line-clamp-2">{module.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {module.tags.map((tag, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleSection>

                {/* Financial Health */}
                <CollapsibleSection
                  title="Financial Health"
                  icon={Activity}
                  defaultOpen={true}
                  count={4}
                >
                  <div className="space-y-2">
                    {financialHealthModules.map((module, i) => {
                      const Icon = module.icon;
                      return (
                        <button
                          key={i}
                          className="w-full p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-green-500/50 hover:shadow-md transition-all text-left group relative overflow-visible"
                        >
                          {module.isNew && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full z-10">
                              New
                            </span>
                          )}
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                              <Icon size={20} className="text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-textPrimary text-sm">{module.title}</h4>
                                <ChevronRight size={16} className="text-textSecondary group-hover:text-green-400 transition-colors" />
                              </div>
                              <p className="text-xs text-textSecondary mt-1 line-clamp-2">{module.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {module.tags.map((tag, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleSection>

                {/* Advanced Analysis */}
                <CollapsibleSection
                  title="Advanced Analysis"
                  icon={Sparkles}
                  defaultOpen={false}
                  count={4}
                >
                  <div className="space-y-2">
                    {advancedModules.map((module, i) => {
                      const Icon = module.icon;
                      return (
                        <button
                          key={i}
                          className="w-full p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-green-500/50 hover:shadow-md transition-all text-left group relative overflow-visible"
                        >
                          {module.isPremium && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 bg-warning text-white text-xs font-medium rounded-full z-10 flex items-center gap-1">
                              <Sparkles size={10} /> Pro
                            </span>
                          )}
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                              <Icon size={20} className="text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-textPrimary text-sm">{module.title}</h4>
                                <ChevronRight size={16} className="text-textSecondary group-hover:text-green-400 transition-colors" />
                              </div>
                              <p className="text-xs text-textSecondary mt-1 line-clamp-2">{module.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {module.tags.map((tag, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleSection>
              </>
            )}

            {activeTab === 'models' && (
              <>
                {/* Model Templates */}
                <CollapsibleSection
                  title="Model Templates"
                  icon={FileSpreadsheet}
                  defaultOpen={true}
                >
                  <div className="space-y-2">
                    {[
                      {
                        icon: Calculator,
                        title: 'rNPV Model Builder',
                        description: 'Step-by-step risk-adjusted NPV with phase probabilities',
                        tags: ['Interactive', 'Guided'],
                      },
                      {
                        icon: LineChart,
                        title: 'Revenue Build-Up',
                        description: 'Patient flow model with epidemiology inputs',
                        tags: ['Bottom-Up', 'Market'],
                      },
                      {
                        icon: TrendingUp,
                        title: 'LBO / Sponsor Returns',
                        description: 'Leverage, IRR, and MoM analysis for PE/VC',
                        tags: ['PE/VC', 'Returns'],
                      },
                      {
                        icon: GitBranch,
                        title: 'Decision Tree Builder',
                        description: 'Interactive scenario modeling with probabilities',
                        tags: ['Scenarios', 'Interactive'],
                        isNew: true,
                      },
                    ].map((template, i) => {
                      const Icon = template.icon;
                      return (
                        <button
                          key={i}
                          className="w-full p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-green-500/50 hover:shadow-md transition-all text-left group relative overflow-visible"
                        >
                          {template.isNew && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full z-10">
                              New
                            </span>
                          )}
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                              <Icon size={20} className="text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-textPrimary text-sm">{template.title}</h4>
                                <ChevronRight size={16} className="text-textSecondary group-hover:text-green-400 transition-colors" />
                              </div>
                              <p className="text-xs text-textSecondary mt-1 line-clamp-2">{template.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {template.tags.map((tag, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleSection>

                {/* My Models */}
                <CollapsibleSection
                  title="My Models"
                  icon={Database}
                  defaultOpen={true}
                  count={3}
                >
                  <div className="space-y-2">
                    {[
                      { name: 'MRNA_DCF_v2.xlsx', date: 'Dec 5, 2024', type: 'DCF' },
                      { name: 'ADC_Comps_Analysis.xlsx', date: 'Dec 3, 2024', type: 'Comps' },
                      { name: 'Target_LBO_Model.xlsx', date: 'Nov 28, 2024', type: 'LBO' },
                    ].map((model, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-surfaceElevated rounded-lg border border-white/10 hover:border-green-500/30 cursor-pointer transition-colors"
                      >
                        <FileSpreadsheet size={16} className="text-green-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-textPrimary">{model.name}</p>
                          <p className="text-xs text-textSecondary">{model.date}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">{model.type}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Benchmark Data */}
                <CollapsibleSection
                  title="Benchmark Data"
                  icon={BarChart3}
                  defaultOpen={true}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: BarChart3, label: 'Success Rates', desc: 'By phase & indication' },
                      { icon: DollarSign, label: 'Cost Benchmarks', desc: 'Development by stage' },
                      { icon: TrendingUp, label: 'Multiples', desc: 'Trading & transaction' },
                      { icon: Globe, label: 'Geo Pricing', desc: 'By market & modality' },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={i}
                          className="p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-green-500/30 transition-colors text-left"
                        >
                          <Icon size={20} className="text-green-400 mb-2" />
                          <p className="text-sm font-semibold text-textPrimary">{item.label}</p>
                          <p className="text-xs text-textSecondary mt-1">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleSection>
              </>
            )}

            {activeTab === 'deals' && (
              <>
                {/* Deal Workflow */}
                <CollapsibleSection
                  title="Deal Workflow"
                  icon={GitBranch}
                  defaultOpen={true}
                >
                  <div className="space-y-2">
                    {[
                      { icon: Search, title: 'Target Screening', desc: 'Financial and strategic fit assessment', tags: ['Phase 1', 'Screening'] },
                      { icon: FileText, title: 'Due Diligence Checklist', desc: 'Comprehensive financial DD with data room tracker', tags: ['Phase 2', 'DD'] },
                      { icon: Calculator, title: 'Valuation & Bid', desc: 'Multi-methodology valuation with bid strategy', tags: ['Phase 3', 'Valuation'] },
                      { icon: Scale, title: 'Deal Structuring', desc: 'Optimize upfront, milestones, royalties, CVRs', tags: ['Phase 4', 'Structure'] },
                      { icon: Shield, title: 'Board Approval', desc: 'IC memo, fairness opinion, governance review', tags: ['Phase 5', 'Approval'] },
                    ].map((step, i) => {
                      const Icon = step.icon;
                      return (
                        <button
                          key={i}
                          className="w-full p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-green-500/50 hover:shadow-md transition-all text-left group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                              <Icon size={20} className="text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-textPrimary text-sm">{step.title}</h4>
                                <ChevronRight size={16} className="text-textSecondary group-hover:text-green-400 transition-colors" />
                              </div>
                              <p className="text-xs text-textSecondary mt-1 line-clamp-2">{step.desc}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {step.tags.map((tag, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleSection>

                {/* Transaction Database */}
                <CollapsibleSection
                  title="Transaction Database"
                  icon={Database}
                  defaultOpen={true}
                >
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium rounded-lg">
                        All Deals
                      </button>
                      <button className="flex-1 px-3 py-2 bg-surfaceElevated border border-white/10 text-textSecondary text-xs font-medium rounded-lg hover:border-green-500/30">
                        M&A
                      </button>
                      <button className="flex-1 px-3 py-2 bg-surfaceElevated border border-white/10 text-textSecondary text-xs font-medium rounded-lg hover:border-green-500/30">
                        Licensing
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Search deals by company, indication..."
                      className="w-full px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    />
                    <p className="text-xs text-textSecondary text-center py-2">
                      2,847 deals in database • Updated Dec 2024
                    </p>
                  </div>
                </CollapsibleSection>

                {/* Recent Notable Deals */}
                <CollapsibleSection
                  title="Recent Notable Deals"
                  icon={Briefcase}
                  defaultOpen={true}
                  count={5}
                >
                  <div className="space-y-2">
                    {[
                      { acquirer: 'AbbVie', target: 'Cerevel', value: '$8.7B', type: 'M&A', date: 'Dec 2023' },
                      { acquirer: 'BMS', target: 'Karuna', value: '$14B', type: 'M&A', date: 'Dec 2023' },
                      { acquirer: 'Roche', target: 'Telavant', value: '$7.25B', type: 'M&A', date: 'Dec 2023' },
                      { acquirer: 'Merck', target: 'Prometheus', value: '$10.8B', type: 'M&A', date: 'Apr 2023' },
                      { acquirer: 'Pfizer', target: 'Seagen', value: '$43B', type: 'M&A', date: 'Mar 2023' },
                    ].map((deal, i) => (
                      <div
                        key={i}
                        className="p-4 bg-surfaceElevated rounded-xl border border-white/10 hover:border-green-500/30 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-textPrimary">{deal.acquirer} → {deal.target}</span>
                          <span className="text-xs font-semibold text-green-400">{deal.value}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">{deal.type}</span>
                          <span className="text-xs text-textSecondary">{deal.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </>
            )}

            {activeTab === 'monitor' && (
              <>
                {/* Watchlist */}
                <CollapsibleSection
                  title="Watchlist"
                  icon={Target}
                  defaultOpen={true}
                  count={6}
                >
                  <div className="space-y-2">
                    {[
                      { ticker: 'MRNA', name: 'Moderna', price: '$62.34', change: '+2.4%', alert: true },
                      { ticker: 'VRTX', name: 'Vertex', price: '$421.50', change: '-0.8%', alert: false },
                      { ticker: 'REGN', name: 'Regeneron', price: '$892.15', change: '+1.2%', alert: false },
                      { ticker: 'ALNY', name: 'Alnylam', price: '$198.60', change: '+3.1%', alert: true },
                      { ticker: 'SGEN', name: 'Seagen', price: '$204.80', change: '-0.3%', alert: false },
                    ].map((stock, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-4 bg-surfaceElevated rounded-xl border border-white/10"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-textPrimary">{stock.ticker}</span>
                            {stock.alert && <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />}
                          </div>
                          <span className="text-xs text-textSecondary">{stock.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-textPrimary">{stock.price}</p>
                          <p className={`text-xs ${stock.change.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                            {stock.change}
                          </p>
                        </div>
                      </div>
                    ))}
                    <button className="w-full p-2 border border-dashed border-white/20 rounded-lg text-sm text-textSecondary hover:border-green-500/50 hover:text-green-400 transition-colors flex items-center justify-center gap-2">
                      <Plus size={16} />
                      Add to Watchlist
                    </button>
                  </div>
                </CollapsibleSection>

                {/* Active Alerts */}
                <CollapsibleSection
                  title="Active Alerts"
                  icon={AlertTriangle}
                  defaultOpen={true}
                  count={3}
                >
                  <div className="space-y-2">
                    {[
                      { company: 'MRNA', type: 'Catalyst', message: 'Phase 3 data expected Q1 2025', priority: 'high' },
                      { company: 'ALNY', type: 'Financial', message: 'Cash runway < 18 months', priority: 'medium' },
                      { company: 'VRTX', type: 'Deal', message: 'Potential acquisition target rumor', priority: 'low' },
                    ].map((alert, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border-l-4 ${
                          alert.priority === 'high'
                            ? 'bg-danger/10 border-danger'
                            : alert.priority === 'medium'
                            ? 'bg-warning/10 border-warning'
                            : 'bg-primary/10 border-primary'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-textPrimary">{alert.company}</span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              alert.priority === 'high'
                                ? 'bg-danger/20 text-danger'
                                : alert.priority === 'medium'
                                ? 'bg-warning/20 text-warning'
                                : 'bg-primary/20 text-primary'
                            }`}
                          >
                            {alert.type}
                          </span>
                        </div>
                        <p className="text-xs text-textSecondary">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* KPI Tracking */}
                <CollapsibleSection
                  title="KPI Tracking"
                  icon={Activity}
                  defaultOpen={true}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Avg Burn Rate', value: '$42M', change: '↓ 8% vs prior Q', positive: true },
                      { label: 'Avg Runway', value: '28 mo', change: '↑ 3 mo vs prior Q', positive: true },
                      { label: 'Sector EV/Sales', value: '4.2x', change: '↓ 0.3x vs 5Y avg', positive: false },
                      { label: 'M&A Premium', value: '68%', change: '↑ 12% vs 2023', positive: true },
                    ].map((kpi, i) => (
                      <div key={i} className="p-4 bg-surfaceElevated rounded-xl border border-white/10">
                        <p className="text-xs text-textSecondary mb-1">{kpi.label}</p>
                        <p className="text-lg font-bold text-textPrimary">{kpi.value}</p>
                        <p className={`text-xs ${kpi.positive ? 'text-success' : 'text-danger'}`}>{kpi.change}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </>
            )}
          </div>

          {/* Data Sources & Generate Report - Match Patent Agent spacing with dividers */}
          <div className={`space-y-4 ${onBackToChat ? 'px-6' : ''}`}>
            <FinancialDataSourcesSection
              defaultOpen={false}
              onConfigure={() => {
                // TODO: Open data sources config
                console.log('Configure data sources');
              }}
            />

            {/* Generate Report - Collapsible */}
            <FinancialGenerateReportSection
              defaultOpen={false}
              onGenerate={(reportType) => {
                // TODO: Generate report
                console.log('Generate report:', reportType);
              }}
            />
          </div>

          {/* Chat Input at Bottom - Padding matches parent container when in tabbed view */}
          <div className={`border-t border-white/10 bg-surfaceElevated ${onBackToChat ? 'p-4' : 'p-6'}`}>
            <div className="relative mb-3">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-textTertiary pointer-events-none" />
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about valuations, deal structures, financial analysis..."
                className="w-full pl-12 pr-4 py-3 bg-surface border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-green-500/50 resize-none"
                rows={3}
                disabled={isProcessing}
              />
            </div>
            <button
              onClick={handleChatSend}
              disabled={!chatInput.trim() || isProcessing}
              className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {isProcessing ? 'Processing...' : 'Send'}
            </button>
            <p className="text-xs text-textTertiary mt-2 text-center">
              Press ⌘+Enter or Ctrl+Enter to send
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
