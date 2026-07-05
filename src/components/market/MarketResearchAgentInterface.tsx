/**
 * Market Research Agent Interface Component
 * Matches Patent Agent side panel design exactly
 * - Analyze tab: Asset input, analysis modules, recent searches
 * - Market tab: Market opportunity, patient flow, pricing & access
 * - Competitive tab: Competitive landscape analysis
 * - Deal Intel tab: Transaction intelligence, valuation, deal structure
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Upload,
  FileText,
  BarChart3,
  Clock,
  Briefcase,
  TrendingUp,
  DollarSign,
  Building2,
  Target,
  AlertTriangle,
  Users,
  Globe,
  PieChart,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Database,
  Send,
  Sparkles,
  Activity,
  Zap,
  Layers,
  Grid3X3,
  Shield,
} from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';
import MarketDataSourcesSection from './MarketDataSourcesSection';
import MarketGenerateReportSection from './MarketGenerateReportSection';

interface MarketResearchAgentInterfaceProps {
  onBackToChat?: () => void;
  className?: string;
}

type MarketTab = 'analyze' | 'market' | 'competitive' | 'deal-intel';

export default function MarketResearchAgentInterface({
  onBackToChat,
  className = '',
}: MarketResearchAgentInterfaceProps) {
  const [activeTab, setActiveTab] = useState<MarketTab>('analyze');
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
    { name: 'XYZ-001', description: 'Breast cancer (HER2+)', loaded: true },
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
      setActiveTab('analyze');
    };

    window.addEventListener('reset-market-interface', handleReset);
    return () => {
      window.removeEventListener('reset-market-interface', handleReset);
    };
  }, []);

  // Analysis modules
  const analysisModules = [
    { title: 'Market Sizing', description: 'TAM/SAM/SOM analysis with growth projections', icon: BarChart3 },
    { title: 'Competitive Positioning', description: 'Market share and differentiation analysis', icon: Target },
    { title: 'Pricing Strategy', description: 'Value-based pricing and payer dynamics', icon: DollarSign },
    { title: 'Revenue Forecasting', description: '5-year revenue models with scenarios', icon: TrendingUp },
    { title: 'Commercial Opportunity', description: 'Market entry and expansion strategy', icon: Globe },
    { title: 'Payer Dynamics', description: 'Reimbursement and coverage analysis', icon: Building2 },
    { title: 'Go-to-Market Strategy', description: 'Launch planning and commercialization', icon: Zap },
    { title: 'Risk Assessment', description: 'Market and competitive risk analysis', icon: AlertTriangle },
  ];

  // Recent searches
  const recentSearches = [
    { name: 'HER2 ADC Market Size', date: 'Today' },
    { name: 'GLP-1 Competitive Landscape', date: 'Yesterday' },
    { name: 'NASH Pricing Analysis', date: '2 days ago' },
    { name: 'CAR-T Market Opportunity', date: '3 days ago' },
    { name: 'Obesity Drug Revenue Forecast', date: '1 week ago' },
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

        const assetMatches = file.name.match(/\b(XYZ-\d+|HER2|ERBB2|GLP-1|NASH|CAR-T|PD-1)\b/gi);
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Handle chat send
  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || isProcessing) return;

    const userMessage = {
      role: 'user' as const,
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsProcessing(true);

    try {
      const currentAsset = loadedAssets.length > 0 ? loadedAssets[0].name : undefined;
      const response = await fetch('/api/agents/market-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          documents: uploadedFiles.filter(f => f.status === 'complete').map((f) => ({ fileName: f.name, name: f.name })),
          asset: currentAsset,
          analysisType: activeTab === 'analyze' ? 'market_analysis' : activeTab === 'market' ? 'market_sizing' : activeTab === 'competitive' ? 'competitive_analysis' : 'deal_intel',
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const agentMessage = {
          role: 'agent' as const,
          content: data.response || data.message || 'Analysis complete',
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, agentMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage = {
        role: 'agent' as const,
        content: `Error: ${err.message || 'Failed to get response from market research agent'}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [chatInput, chatMessages, uploadedFiles, loadedAssets, activeTab, isProcessing]);

  // Handle key down for chat
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleChatSend();
    }
  }, [handleChatSend]);

  return (
    <div className={`flex flex-col flex-1 w-full relative ${className}`}>
      {/* Main Interface - Show when no detail panel is active */}
      {!activeDetailPanel && (
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Header - Only show if onBackToChat is provided */}
          {onBackToChat && (
            <div className="p-4 border-b border-border">
              {activeDetailPanel && (
                <button
                  onClick={onBackToChat}
                  className="flex items-center gap-2 text-sm text-textSecondary hover:text-textPrimary mb-3 transition-colors"
                >
                  <ChevronLeft size={16} />
                  Back to Market Analyst
                </button>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <BarChart3 size={20} className="text-teal-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-textPrimary">Market Analyst</h2>
                  <p className="text-xs text-textSecondary">Market research & BD intelligence</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation - Match Financial Agent styling exactly */}
          {onBackToChat ? (
            <div className="p-4">
              <div className="mb-4 flex gap-1 bg-surfaceElevated rounded-lg overflow-x-auto">
                {[
                  { id: 'analyze' as const, label: 'Analyze', icon: Search },
                  { id: 'market' as const, label: 'Market', icon: BarChart3 },
                  { id: 'competitive' as const, label: 'Competitive', icon: Target },
                  { id: 'deal-intel' as const, label: 'Deal Intel', icon: Briefcase },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-w-0 ${
                        activeTab === tab.id
                          ? 'bg-surface text-teal-400 shadow-sm'
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
            <div className="mb-4 p-4 flex gap-1 bg-surfaceElevated rounded-lg overflow-x-auto">
              {[
                { id: 'analyze' as const, label: 'Analyze' },
                { id: 'market' as const, label: 'Market' },
                { id: 'competitive' as const, label: 'Competitive' },
                { id: 'deal-intel' as const, label: 'Deal Intel' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-xs font-medium transition-all min-w-0 overflow-hidden ${
                    activeTab === tab.id
                      ? 'bg-teal-600/20 text-teal-400 shadow-sm border border-teal-500/30'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceElevated'
                  }`}
                >
                  <span className="truncate w-full text-center">{tab.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Tab Content - Match Financial Agent spacing */}
          <div className={`flex-1 overflow-y-auto space-y-4 ${onBackToChat ? 'p-4' : ''}`}>
            {activeTab === 'analyze' && (
              <div className="space-y-4">
                {/* Skills Section - Enhanced (like Patent Agent) */}
                <CollapsibleSection
                  title="Analysis Modules"
                  icon={Layers}
                  defaultOpen={true}
                >
                  <div className="space-y-2">
                    {analysisModules.map((module, i) => {
                      const Icon = module.icon;
                      return (
                        <button
                          key={i}
                          onClick={async () => {
                            setIsProcessing(true);
                            try {
                              const currentAsset = loadedAssets.length > 0 ? loadedAssets[0].name : undefined;
                              const response = await fetch('/api/agents/market-research', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  messages: [{
                                    role: 'user',
                                    content: `Analyze ${module.title.toLowerCase()} for ${currentAsset || 'the asset'}. ${module.description}`,
                                  }],
                                  documents: uploadedFiles.filter(f => f.status === 'complete').map((f) => ({ 
                                    fileName: f.name,
                                    name: f.name 
                                  })),
                                  asset: currentAsset,
                                  analysisType: module.title.toLowerCase().replace(/\s+/g, '_'),
                                }),
                                credentials: 'include',
                              });

                              if (response.ok) {
                                const data = await response.json();
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
                          }}
                          className="w-full p-4 bg-surfaceElevated border border-border rounded-xl hover:border-teal-500/50 hover:shadow-md transition-all text-left group relative"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 p-2 bg-teal-500/20 rounded-lg group-hover:bg-teal-500/30 transition-colors">
                              <Icon size={20} className="text-teal-400" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-semibold text-textPrimary text-sm flex-shrink-0">{module.title}</h4>
                                <ChevronRight size={16} className="text-textSecondary group-hover:text-teal-400 transition-colors flex-shrink-0" />
                              </div>
                              <p className="text-xs text-textSecondary mt-1 line-clamp-2">{module.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleSection>

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
                          ? 'border-teal-500/50 bg-teal-500/10'
                          : 'border-border hover:border-border bg-surfaceElevated'
                      }`}
                    >
                      <Upload size={24} className="mx-auto text-textTertiary mb-2" />
                      <p className="text-sm font-medium text-textPrimary mb-1">Drop files here</p>
                      <p className="text-xs text-textSecondary">Market reports, analyst notes, filings</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.csv,.xlsx,.xls,.doc,.docx"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 px-4 py-2 bg-teal-500/20 border border-teal-500/30 rounded-lg text-sm text-teal-400 hover:bg-teal-500/30 transition-colors"
                      >
                        Browse Files
                      </button>
                    </div>

                    {/* File Type Chips */}
                    <div className="flex flex-wrap gap-2">
                      {['PDF', 'XLSX', 'SEC', 'URL'].map((type) => (
                        <span
                          key={type}
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            type === 'PDF'
                              ? 'text-teal-400 bg-teal-500/20'
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
                            className="flex items-center gap-3 p-4 bg-surfaceElevated rounded-xl border border-border hover:border-teal-500/30 cursor-pointer transition-colors"
                          >
                            <FileText size={16} className="text-teal-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-textPrimary truncate">{file.name}</p>
                              <p className="text-xs text-textSecondary">{file.type} • {file.size}</p>
                            </div>
                            {file.status === 'processing' && (
                              <Loader2 size={16} className="text-teal-400 animate-spin" />
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
                        placeholder="Enter asset, company, or indication"
                        className="flex-1 px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent"
                      />
                      <button
                        onClick={() => {
                          if (assetInput.trim()) {
                            setLoadedAssets((prev) => {
                              if (!prev.some((a) => a.name.toUpperCase() === assetInput.toUpperCase())) {
                                return [
                                  ...prev,
                                  {
                                    name: assetInput.toUpperCase(),
                                    description: 'User-entered asset',
                                    loaded: true,
                                  },
                                ];
                              }
                              return prev;
                            });
                            setAssetInput('');
                          }
                        }}
                        className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-1"
                      >
                        <Search size={16} />
                        Fetch
                      </button>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Loaded Assets */}
                {loadedAssets.length > 0 && (
                  <CollapsibleSection
                    title="Loaded Assets"
                    icon={FileText}
                    defaultOpen={true}
                  >
                    <div className="space-y-2">
                      {loadedAssets.map((asset, i) => (
                        <div
                          key={i}
                          className={`p-4 bg-surfaceElevated border rounded-xl ${
                            asset.loaded ? 'border-teal-500/30' : 'border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2">
                              <FileText size={16} className="text-textTertiary mt-0.5" />
                              <div>
                                <p className="font-medium text-textPrimary">{asset.name}</p>
                                <p className="text-sm text-textSecondary">{asset.description}</p>
                              </div>
                            </div>
                            {asset.loaded && <CheckCircle2 size={20} className="text-emerald-400" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Recent Searches */}
                <CollapsibleSection
                  title="Recent Searches"
                  icon={Clock}
                  defaultOpen={false}
                >
                  <div className="space-y-2">
                    {recentSearches.map((search, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-2 hover:bg-surface rounded-lg transition-colors"
                      >
                        <p className="text-sm font-medium text-textPrimary">{search.name}</p>
                        <p className="text-xs text-textSecondary">{search.date}</p>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {activeTab === 'market' && (
              <div className="space-y-4">
                {/* Market Search */}
                <CollapsibleSection
                  title="Market Search"
                  icon={Search}
                  defaultOpen={true}
                >
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by indication, modality, geography..."
                      className="w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    />
                    <div className="flex gap-2">
                      <select className="flex-1 px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                        <option>All Modalities</option>
                        <option>Small Molecule</option>
                        <option>Antibody</option>
                        <option>Cell Therapy</option>
                      </select>
                      <select className="flex-1 px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                        <option>All Regions</option>
                        <option>US</option>
                        <option>EU5</option>
                        <option>Japan</option>
                      </select>
                    </div>
                    <button
                      onClick={async () => {
                        if (!searchQuery.trim()) return;
                        setIsProcessing(true);
                        try {
                          const response = await fetch('/api/agents/market-research', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              messages: [{
                                role: 'user',
                                content: `Search market sizing for: ${searchQuery}`,
                              }],
                              asset: loadedAssets.length > 0 ? loadedAssets[0].name : undefined,
                              analysisType: 'market_sizing',
                            }),
                            credentials: 'include',
                          });

                          if (response.ok) {
                            const data = await response.json();
                            setChatMessages((prev) => [...prev, {
                              role: 'agent',
                              content: `## Market Search Results\n\n${data.response || data.message}`,
                              timestamp: new Date(),
                            }]);
                          }
                        } catch (err) {
                          console.error('Market search error:', err);
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      className="w-full py-2.5 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!searchQuery.trim() || isProcessing}
                    >
                      <Search size={16} />
                      Search Market Data
                    </button>
                  </div>
                </CollapsibleSection>

                {/* Market Opportunity */}
                <CollapsibleSection
                  title="Market Opportunity"
                  icon={TrendingUp}
                  defaultOpen={true}
                >
                  <div className="p-4 bg-surfaceElevated border border-border rounded-xl">
                    <p className="text-sm text-textSecondary">Market sizing analysis will appear here</p>
                  </div>
                </CollapsibleSection>

                {/* Patient Flow */}
                <CollapsibleSection
                  title="Patient Flow"
                  icon={Users}
                  defaultOpen={false}
                >
                  <div className="p-4 bg-surfaceElevated border border-border rounded-xl">
                    <p className="text-sm text-textSecondary">Patient flow funnel will appear here</p>
                  </div>
                </CollapsibleSection>

                {/* Pricing & Access */}
                <CollapsibleSection
                  title="Pricing & Access"
                  icon={DollarSign}
                  defaultOpen={false}
                >
                  <div className="p-4 bg-surfaceElevated border border-border rounded-xl">
                    <p className="text-sm text-textSecondary">Pricing and access analysis will appear here</p>
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {activeTab === 'competitive' && (
              <div className="space-y-4">
                {/* Landscape Search */}
                <CollapsibleSection
                  title="Landscape Search"
                  icon={Search}
                  defaultOpen={true}
                >
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Search by target, indication, company..."
                      className="w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    />
                    <div className="flex gap-2">
                      <select className="flex-1 px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                        <option>All Modalities</option>
                        <option>Small Molecule</option>
                        <option>Antibody</option>
                        <option>Cell Therapy</option>
                      </select>
                      <select className="flex-1 px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-teal-500/50">
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
                          const response = await fetch('/api/agents/market-research', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              messages: [{
                                role: 'user',
                                content: 'Analyze competitive landscape for the current asset',
                              }],
                              asset: loadedAssets.length > 0 ? loadedAssets[0].name : undefined,
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
                          }
                        } catch (err) {
                          console.error('Competitive analysis error:', err);
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      className="w-full py-2.5 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isProcessing}
                    >
                      <Search size={16} />
                      Search Competitive Intel
                    </button>
                  </div>
                </CollapsibleSection>

                {/* Competitive Assessment */}
                <CollapsibleSection
                  title="Competitive Assessment"
                  icon={Target}
                  defaultOpen={true}
                >
                  <div className="p-4 bg-surfaceElevated border border-border rounded-xl">
                    <p className="text-sm text-textSecondary">Competitive landscape analysis will appear here</p>
                  </div>
                </CollapsibleSection>

                {/* Saved Landscapes */}
                <CollapsibleSection
                  title="PD-1/PD-L1 Landscape"
                  icon={FileText}
                  defaultOpen={false}
                >
                  <div className="p-2 space-y-1">
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-surface rounded-lg transition-colors"
                    >
                      <p className="text-sm text-textSecondary">8 active programs tracked</p>
                    </button>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="GLP-1 RA Landscape"
                  icon={FileText}
                  defaultOpen={false}
                >
                  <div className="p-2 space-y-1">
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-surface rounded-lg transition-colors"
                    >
                      <p className="text-sm text-textSecondary">12 programs across obesity/diabetes</p>
                    </button>
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {activeTab === 'deal-intel' && (
              <div className="space-y-4">
                {/* Deal Search */}
                <CollapsibleSection
                  title="Deal Search"
                  icon={Search}
                  defaultOpen={true}
                >
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Search for deals, partnerships, M&A..."
                      className="w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    />
                    <div className="flex gap-2">
                      <select className="flex-1 px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                        <option>All Deal Types</option>
                        <option>M&A</option>
                        <option>Licensing</option>
                        <option>Partnership</option>
                      </select>
                      <select className="flex-1 px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-teal-500/50">
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
                          const response = await fetch('/api/agents/market-research', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              messages: [{
                                role: 'user',
                                content: 'Search for recent deals and partnerships',
                              }],
                              asset: loadedAssets.length > 0 ? loadedAssets[0].name : undefined,
                              analysisType: 'deal_intel',
                            }),
                            credentials: 'include',
                          });

                          if (response.ok) {
                            const data = await response.json();
                            setChatMessages((prev) => [...prev, {
                              role: 'agent',
                              content: `## Deal Intelligence\n\n${data.response || data.message}`,
                              timestamp: new Date(),
                            }]);
                          }
                        } catch (err) {
                          console.error('Deal search error:', err);
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      className="w-full py-2.5 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isProcessing}
                    >
                      <Search size={16} />
                      Search Deals
                    </button>
                  </div>
                </CollapsibleSection>

                {/* Valuation Overview */}
                <CollapsibleSection
                  title="Valuation Overview"
                  icon={FileText}
                  defaultOpen={true}
                >
                  <div className="p-4 bg-surfaceElevated border border-border rounded-xl">
                    <p className="text-sm text-textSecondary">Valuation analysis will appear here</p>
                  </div>
                </CollapsibleSection>

                {/* Transaction Intelligence */}
                <CollapsibleSection
                  title="Transaction Intelligence"
                  icon={Briefcase}
                  defaultOpen={false}
                >
                  <div className="p-4 bg-surfaceElevated border border-border rounded-xl">
                    <p className="text-sm text-textSecondary">Transaction intelligence will appear here</p>
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {/* Data Sources - Collapsible (like Patent Agent) */}
            <MarketDataSourcesSection
              defaultOpen={false}
              onConfigure={() => {
                // TODO: Open data sources config modal
                console.log('Configure data sources');
              }}
            />

            {/* Generate Report - Collapsible (like Patent Agent) */}
            <MarketGenerateReportSection
              defaultOpen={false}
              asset={loadedAssets.length > 0 ? loadedAssets[0].name : undefined}
              documents={uploadedFiles.filter(f => f.status === 'complete').map((f) => ({ name: f.name }))}
            />
          </div>

          {/* Chat Input - Match Clinical/Financial Agent styling - Always visible */}
          <div className={`border-t border-border bg-surfaceElevated ${onBackToChat ? 'p-4' : 'p-6'}`}>
            <div className="relative mb-3">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-textTertiary pointer-events-none" />
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about market sizing, competitive positioning, pricing strategy, revenue forecasts..."
                rows={3}
                className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 resize-none transition-colors"
                disabled={isProcessing}
              />
            </div>
            <button
              onClick={handleChatSend}
              disabled={!chatInput.trim() || isProcessing}
              className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
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

            {/* Chat Messages Display */}
            {chatMessages.length > 0 && (
              <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                {chatMessages.map((message, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-teal-500/10 border border-teal-500/20 ml-auto max-w-[80%]'
                        : 'bg-surface border border-border'
                    }`}
                  >
                    <p className="text-sm text-textPrimary whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
