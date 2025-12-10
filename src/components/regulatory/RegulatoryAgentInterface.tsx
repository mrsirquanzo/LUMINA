/**
 * Regulatory Agent Interface Component
 * Comprehensive UI for regulatory analysis with tabbed interface:
 * - Overview tab: Executive summary, expedited pathways, key metrics
 * - Timeline tab: Development timeline and milestones
 * - Risks tab: Safety assessment, CMC risks, regulatory risks
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Target,
  Zap,
  Globe,
  Building2,
  Scale,
  TrendingUp,
  AlertCircle,
  Calendar,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X,
  Send,
  Sparkles,
  Upload,
  Search,
  Activity,
  Lock,
  Award,
  XCircle,
  Minus,
  Info,
  Database,
} from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';
import RegulatoryDataSourcesSection from './RegulatoryDataSourcesSection';
import RegulatoryGenerateReportSection from './RegulatoryGenerateReportSection';

interface RegulatoryAgentInterfaceProps {
  onBackToChat?: () => void;
  className?: string;
}

type RegulatoryTab = 'overview' | 'timeline' | 'risks';

export default function RegulatoryAgentInterface({
  onBackToChat,
  className = '',
}: RegulatoryAgentInterfaceProps) {
  const [activeTab, setActiveTab] = useState<RegulatoryTab>('overview');
  const [assetInput, setAssetInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    type: string;
    size: string;
    status: 'processing' | 'complete' | 'error';
  }>>([]);
  const [loadedAssets, setLoadedAssets] = useState<Array<{
    name: string;
    description: string;
    loaded: boolean;
  }>>([
    { name: 'XYZ-001', description: 'NSCLC (KRAS G12C+)', loaded: true },
  ]);
  const [activeDetailPanel, setActiveDetailPanel] = useState<string | null>(null);
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
      setActiveTab('overview');
    };

    window.addEventListener('reset-regulatory-interface', handleReset);
    return () => {
      window.removeEventListener('reset-regulatory-interface', handleReset);
    };
  }, []);

  // Analysis modules
  const analysisModules = [
    { title: 'Pathway Strategy', description: 'NDA/BLA pathway recommendation', icon: Target },
    { title: 'Expedited Designations', description: 'BTD, Fast Track, Accelerated Approval', icon: Zap },
    { title: 'Safety Assessment', description: 'Mechanism-based safety evaluation', icon: Shield },
    { title: 'CMC Readiness', description: 'Manufacturing and quality assessment', icon: Building2 },
    { title: 'Label Strategy', description: 'Label expectations and claims', icon: Scale },
    { title: 'Global Strategy', description: 'EMA, PMDA, NMPA pathways', icon: Globe },
    { title: 'Competitive Timing', description: 'First-to-market analysis', icon: TrendingUp },
    { title: 'Exclusivity Strategy', description: 'Orphan, pediatric, NCE exclusivity', icon: Lock },
  ];

  // Recent analyses
  const recentAnalyses = [
    { name: 'CAR-T Regulatory Path', date: 'Today' },
    { name: 'KRAS G12C Approval Strategy', date: 'Yesterday' },
    { name: 'GLP-1 CMC Assessment', date: '2 days ago' },
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
        const validTypes = ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const isValidType = validTypes.includes(file.type) || ['pdf', 'csv', 'xlsx', 'xls', 'doc', 'docx'].includes(fileExtension || '');

        if (!isValidType) {
          setUploadedFiles((prev) =>
            prev.map((f) => (f.name === file.name ? { ...f, status: 'error' as const } : f))
          );
          continue;
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));

        const assetMatches = file.name.match(/\b(XYZ-\d+|KRAS|GLP-1|CAR-T|PD-1)\b/gi);
        if (assetMatches && assetMatches.length > 0) {
          const assetName = assetMatches[0].toUpperCase();
          setLoadedAssets((prev) => {
            if (!prev.some((a) => a.name === assetName)) {
              return [
                ...prev,
                {
                  name: assetName,
                  description: 'Loaded from uploaded file',
                  loaded: true,
                },
              ];
            }
            return prev;
          });
        }

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
      const currentAsset = loadedAssets.length > 0 ? loadedAssets[0].name : undefined;
      
      const response = await fetch('/api/agents/regulatory', {
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
          asset: currentAsset,
          analysisType: activeTab === 'overview' ? 'pathway_analysis' : activeTab === 'timeline' ? 'timeline_analysis' : 'risk_analysis',
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from regulatory agent');
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
        content: `Error: ${err.message || 'Failed to get response from regulatory agent'}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [chatInput, chatMessages, uploadedFiles, loadedAssets, activeTab, isProcessing]);

  // Handle key down for chat
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleChatSend();
      }
    },
    [handleChatSend]
  );

  return (
    <div className={`flex flex-col flex-1 w-full relative ${className}`}>
      {/* Main Interface */}
      {!activeDetailPanel && (
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Tab Navigation - Match Financial Agent styling exactly */}
          {onBackToChat ? (
            <div className="px-6 pt-4">
              <div className="mb-4 flex gap-1 p-1 bg-surfaceElevated rounded-lg overflow-x-auto">
                {[
                  { id: 'overview' as const, label: 'Overview' },
                  { id: 'timeline' as const, label: 'Timeline' },
                  { id: 'risks' as const, label: 'Risks' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-xs font-medium transition-all min-w-0 overflow-hidden ${
                      activeTab === tab.id
                        ? 'bg-orange-600/20 text-orange-400 shadow-sm border border-orange-500/30'
                        : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceElevated'
                    }`}
                  >
                    <span className="truncate w-full text-center">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4 px-6 flex gap-1 p-1 bg-surfaceElevated rounded-lg overflow-x-auto">
              {[
                { id: 'overview' as const, label: 'Overview' },
                { id: 'timeline' as const, label: 'Timeline' },
                { id: 'risks' as const, label: 'Risks' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-surface text-orange-400 shadow-sm'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Tab Content - Match Financial Agent spacing */}
          <div className={`flex-1 overflow-y-auto space-y-4 ${onBackToChat ? 'px-6 pb-4' : ''}`}>
            {activeTab === 'overview' && (
              <>
                {/* Asset Input Section */}
                <CollapsibleSection
                  title="Asset Input"
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
                          ? 'border-orange-500/50 bg-orange-500/10'
                          : 'border-white/20 hover:border-white/30 bg-surfaceElevated'
                      }`}
                    >
                      <Upload size={24} className="mx-auto text-textTertiary mb-2" />
                      <p className="text-sm font-medium text-textPrimary mb-1">Drop regulatory documents here</p>
                      <p className="text-xs text-textSecondary">PDF, IND submissions, FDA correspondence</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.csv,.xlsx,.doc,.docx"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-sm text-orange-400 hover:bg-orange-500/30 transition-colors"
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
                            className="flex items-center gap-3 p-4 bg-surfaceElevated rounded-xl border border-white/10 hover:border-orange-500/30 cursor-pointer transition-colors"
                          >
                            <FileText size={16} className="text-orange-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-textPrimary truncate">{file.name}</p>
                              <p className="text-xs text-textSecondary">{file.type} • {file.size}</p>
                            </div>
                            {file.status === 'processing' && (
                              <Loader2 size={16} className="text-orange-400 animate-spin" />
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

                    {/* Asset Search */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={assetInput}
                        onChange={(e) => setAssetInput(e.target.value)}
                        placeholder="Enter asset name or indication..."
                        className="flex-1 px-4 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-orange-500/50"
                      />
                      <button
                        onClick={() => {
                          if (assetInput.trim()) {
                            setLoadedAssets((prev) => {
                              if (!prev.some((a) => a.name === assetInput.trim())) {
                                return [
                                  ...prev,
                                  {
                                    name: assetInput.trim(),
                                    description: 'User entered',
                                    loaded: true,
                                  },
                                ];
                              }
                              return prev;
                            });
                            setAssetInput('');
                          }
                        }}
                        className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-400 hover:bg-orange-500/30 transition-colors"
                      >
                        <Search size={16} />
                      </button>
                    </div>

                    {/* Loaded Assets */}
                    {loadedAssets.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-wide">Loaded Assets</h4>
                        {loadedAssets.map((asset, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-surfaceElevated rounded-lg border border-white/10"
                          >
                            <div>
                              <p className="text-sm font-medium text-textPrimary">{asset.name}</p>
                              <p className="text-xs text-textSecondary">{asset.description}</p>
                            </div>
                            {asset.loaded && (
                              <CheckCircle2 size={16} className="text-emerald-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                <div className="mt-4 pt-4 border-t border-white/10">
                  {/* Analysis Modules */}
                  <CollapsibleSection
                    title="Analysis Modules"
                    icon={Activity}
                    defaultOpen={true}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {analysisModules.map((module, idx) => {
                        const ModuleIcon = module.icon;
                        return (
                          <button
                            key={idx}
                            className="p-3 bg-surfaceElevated rounded-lg border border-white/10 hover:border-orange-500/30 transition-colors text-left group"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <ModuleIcon size={16} className="text-orange-400" />
                              <span className="text-xs font-medium text-textPrimary">{module.title}</span>
                            </div>
                            <p className="text-xs text-textSecondary">{module.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleSection>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  {/* Recent Analyses */}
                  <CollapsibleSection
                    title="Recent Analyses"
                    icon={Clock}
                    defaultOpen={false}
                  >
                    <div className="space-y-2">
                      {recentAnalyses.map((analysis, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-surfaceElevated rounded-lg border border-white/10 hover:border-orange-500/30 cursor-pointer transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-textPrimary">{analysis.name}</p>
                            <p className="text-xs text-textSecondary">{analysis.date}</p>
                          </div>
                          <ChevronRight size={16} className="text-textTertiary" />
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  {/* Data Sources */}
                  <RegulatoryDataSourcesSection defaultOpen={false} />
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  {/* Generate Report */}
                  <RegulatoryGenerateReportSection defaultOpen={false} />
                </div>
              </>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <div className="p-4 bg-surfaceElevated rounded-lg border border-white/10">
                  <h3 className="text-sm font-semibold text-textPrimary mb-2">Development Timeline</h3>
                  <p className="text-xs text-textSecondary">Timeline visualization and milestone tracking will appear here</p>
                </div>
              </div>
            )}

            {activeTab === 'risks' && (
              <div className="space-y-4">
                <div className="p-4 bg-surfaceElevated rounded-lg border border-white/10">
                  <h3 className="text-sm font-semibold text-textPrimary mb-2">Regulatory Risks</h3>
                  <p className="text-xs text-textSecondary">Safety assessment, CMC risks, and regulatory risk analysis will appear here</p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input - Match Clinical/Financial Agent styling - Fixed at bottom */}
          <div className={`border-t border-white/10 bg-surfaceElevated ${onBackToChat ? 'p-4' : 'p-6'}`}>
            <div className="relative mb-3">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-textTertiary pointer-events-none" />
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about regulatory pathways, approval timelines, or compliance..."
                className="w-full pl-12 pr-4 py-3 bg-surface border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 resize-none transition-colors"
                rows={3}
                disabled={isProcessing}
              />
            </div>
            <button
              onClick={handleChatSend}
              disabled={!chatInput.trim() || isProcessing}
              className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
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
    </div>
  );
}
