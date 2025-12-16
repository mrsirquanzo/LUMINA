/**
 * Target Biology Agent Interface Component
 * Comprehensive UI for target biology analysis with tabbed interface:
 * - Expression: Tumor selectivity and safety signals
 * - Literature: Upload, summarize, synthesize MOA and evidence
 * - Validation: Genetic evidence, tumor dependencies, direction of effect
 * - Landscape: Competitive intelligence and clinical evidence
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dna,
  Upload,
  Loader2,
  X,
  Search,
  FileText,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Shield,
  ChevronRight,
  ChevronDown,
  BarChart3,
  BookOpen,
  Target,
  Activity,
  Sparkles,
  Send,
  ArrowLeft,
  Lock,
  Eye,
  Database,
  Zap,
} from 'lucide-react';
import LoginModal from '../shared/LoginModal';
import CollapsibleSection from '../shared/CollapsibleSection';

type Modality = 'small_molecule' | 'adc' | 'tce';
type TabType = 'expression' | 'literature' | 'validation' | 'landscape';

interface TargetBiologyAgentInterfaceProps {
  onBackToChat?: () => void;
  className?: string;
  targetSymbol?: string;
}

const MODALITY_LABELS: Record<Modality, string> = {
  small_molecule: 'Small Molecule',
  adc: 'ADC',
  tce: 'TCE',
};

export default function TargetBiologyAgentInterface({
  onBackToChat,
  className = '',
  targetSymbol = '',
}: TargetBiologyAgentInterfaceProps) {
  const [activeTab, setActiveTab] = useState<TabType>('expression');
  const [modality, setModality] = useState<Modality>('adc');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Literature tab state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [literatureQuery, setLiteratureQuery] = useState('');
  const [literatureInsights, setLiteratureInsights] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Chat state for agent interaction
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'agent'; content: string; timestamp: Date }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
        });
        const data = await response.json();
        setIsAuthenticated(data.authenticated || false);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [showLoginModal]);

  // Drag and drop handlers for literature tab
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

    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));

    if (pdfFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...pdfFiles]);
    } else {
      setError('Please upload PDF files only');
    }
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const pdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.endsWith('.pdf')
    );

    if (pdfFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...pdfFiles]);
    } else {
      setError('Please upload PDF files only');
    }
  }, []);


  // Handle literature query
  const handleLiteratureQuery = useCallback(async () => {
    if (!literatureQuery.trim()) return;

    // TODO: Implement literature query API call
    console.log('Literature query:', literatureQuery);
  }, [literatureQuery]);

  // Handle chat message to agent
  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || !targetSymbol) return;

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    const userMessage = {
      role: 'user' as const,
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/target-biology', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetSymbol: targetSymbol.trim(),
          query: currentInput,
          modality,
          format: 'scientist',
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          setShowLoginModal(true);
          throw new Error('Authentication required');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from target biology agent');
      }

      const data = await response.json();

      const agentMessage = {
        role: 'agent' as const,
        content: data.answer || data.formatted || data.response || 'Analysis complete',
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, agentMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage = {
        role: 'agent' as const,
        content: `Error: ${err.message || 'Failed to get response from target biology agent'}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
      setError(err.message || 'Failed to get response from target biology agent');
    } finally {
      setIsChatProcessing(false);
    }
  }, [chatInput, targetSymbol, modality, isAuthenticated]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tabs */}
      <div className="mb-4 p-4 flex gap-1 bg-surfaceElevated rounded-lg overflow-x-auto">
        {[
          { id: 'expression' as TabType, label: 'Expression' },
          { id: 'literature' as TabType, label: 'Literature' },
          { id: 'validation' as TabType, label: 'Validation' },
          { id: 'landscape' as TabType, label: 'Landscape' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-xs font-medium transition-all min-w-0 overflow-hidden ${
              activeTab === tab.id
                ? 'bg-emerald-600/20 text-emerald-400 shadow-sm border border-emerald-500/30'
                : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceElevated'
            }`}
          >
            <span className="truncate w-full text-center">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Expression Tab */}
          {activeTab === 'expression' && (
            <motion.div
              key="expression"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="p-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-textPrimary">Expression Analysis</h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-surfaceElevated border border-white/10 rounded-lg">
                  <span className="text-xs text-textSecondary">Modality:</span>
                  <select
                    value={modality}
                    onChange={(e) => setModality(e.target.value as Modality)}
                    className="bg-transparent border-none text-xs text-textPrimary focus:outline-none"
                  >
                    <option value="adc">ADC</option>
                    <option value="tce">TCE</option>
                    <option value="small_molecule">Small Molecule</option>
                  </select>
                </div>
              </div>

              {/* Therapeutic Window Score */}
              {analysisResults && (
                <div className="p-4 bg-surfaceElevated border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-textPrimary">
                      Therapeutic Window Score
                    </span>
                    <span className="text-lg font-semibold text-primary">4.2</span>
                  </div>
                  <p className="text-xs text-textSecondary mb-3">(Tumor/Normal Ratio)</p>
                  <div className="w-full bg-surface rounded-full h-2">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
                      style={{ width: '84%' }}
                    />
                  </div>
                </div>
              )}

              {/* Tumor vs Normal Heatmap */}
              <div className="p-4 bg-surfaceElevated border-x-0 border-y border-white/10 rounded-none">
                <h4 className="text-sm font-semibold text-textPrimary mb-4">
                  Tumor vs. Normal Heatmap
                </h4>
                <div className="space-y-3">
                  {[
                    { tissue: 'Lung', tumor: 8.2, normal: 1.0, ratio: 8.2, status: 'good' },
                    { tissue: 'Colon', tumor: 5.1, normal: 1.0, ratio: 5.1, status: 'good' },
                    { tissue: 'Breast', tumor: 1.8, normal: 1.0, ratio: 1.8, status: 'warning' },
                    { tissue: 'Heart', tumor: 0.2, normal: 1.0, ratio: 0.2, status: 'safe' },
                    { tissue: 'Liver', tumor: 0.4, normal: 1.0, ratio: 0.4, status: 'safe' },
                  ].map((row) => (
                    <div
                      key={row.tissue}
                      className="flex items-center gap-4 p-3 bg-surface rounded-lg border border-white/10"
                    >
                      <div className="w-20 text-sm font-medium text-textPrimary">{row.tissue}</div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-surfaceElevated rounded h-2 relative">
                          <div
                            className="h-full bg-primary rounded"
                            style={{ width: `${Math.min(100, (row.tumor / 10) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-textSecondary w-12 text-right">Tumor</span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-surfaceElevated rounded h-2 relative">
                          <div
                            className="h-full bg-textTertiary rounded"
                            style={{ width: `${Math.min(100, (row.normal / 10) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-textSecondary w-12 text-right">Normal</span>
                      </div>
                      <div className="w-16 text-sm font-medium text-textPrimary text-right">
                        {row.ratio}x
                      </div>
                      <div className="w-20 text-right">
                        {row.status === 'good' && (
                          <CheckCircle className="w-4 h-4 text-success inline" />
                        )}
                        {row.status === 'warning' && (
                          <AlertTriangle className="w-4 h-4 text-warning inline" />
                        )}
                        {row.status === 'safe' && (
                          <span className="text-xs text-success">✓ Safe</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flags */}
              <div className="p-4 bg-warning/10 border-x-0 border-y border-warning/20 rounded-none">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-warning mb-1">Flag</p>
                    <p className="text-sm text-textSecondary">
                      Moderate expression in normal breast tissue may limit ADC therapeutic window
                    </p>
                  </div>
                </div>
              </div>

              {/* Cell Surface Info */}
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="p-4 bg-surfaceElevated border border-white/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-textPrimary">Cell Surface</span>
                  </div>
                  <p className="text-xs text-textSecondary">Confirmed (HPA)</p>
                </div>
                <div className="p-4 bg-surfaceElevated border border-white/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-textSecondary" />
                    <span className="text-sm font-medium text-textPrimary">Internalization</span>
                  </div>
                  <p className="text-xs text-textSecondary">Moderate (literature)</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Literature Tab */}
          {activeTab === 'literature' && (
            <motion.div
              key="literature"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-textPrimary">Literature Analysis</h3>
                <div className="px-3 py-1 bg-surfaceElevated border border-white/10 rounded-lg">
                  <span className="text-sm text-textSecondary">
                    {uploadedFiles.length} doc{uploadedFiles.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* File Upload */}
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 transition-all ${
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-white/20 hover:border-primary/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  multiple
                  onChange={handleFileSelect}
                />
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      isDragging ? 'bg-primary/20' : 'bg-surfaceElevated'
                    } transition-colors`}
                  >
                    <FileText className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-textTertiary'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-textPrimary mb-1">
                      Drop PDFs here or click to upload
                    </p>
                    <p className="text-xs text-textSecondary">Supports: PDF, Word, PowerPoint</p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textSecondary hover:text-textPrimary hover:border-primary/50 transition-colors"
                  >
                    Browse Files
                  </button>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-surfaceElevated border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-textTertiary flex-shrink-0" />
                        <span className="text-sm text-textPrimary truncate">{file.name}</span>
                      </div>
                      <button
                        onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 hover:bg-surface rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-textTertiary" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Analysis Modes */}
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-3">
                  Analysis Mode:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'moa', label: 'MOA Synthesis' },
                    { id: 'evidence', label: 'Evidence Summary' },
                    { id: 'compare', label: 'Compare Claims' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      className="px-4 py-3 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary hover:border-primary/50 transition-colors"
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Input */}
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Ask a question:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={literatureQuery}
                    onChange={(e) => setLiteratureQuery(e.target.value)}
                    placeholder="What resistance mechanisms have been observed in preclinical models?"
                    className="w-full pl-4 pr-12 py-3 bg-surfaceElevated border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-primary/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLiteratureQuery();
                      }
                    }}
                  />
                  <button
                    onClick={handleLiteratureQuery}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-surface rounded transition-colors"
                  >
                    <Search className="w-4 h-4 text-textTertiary" />
                  </button>
                </div>
              </div>

              {/* Recent Insights */}
              {literatureInsights.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-textPrimary mb-3">Recent Insights:</h4>
                  <div className="space-y-2">
                    {literatureInsights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textSecondary"
                      >
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validation' && (
            <motion.div
              key="validation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-textPrimary">Target Validation</h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-surfaceElevated border border-white/10 rounded-lg">
                  <span className="text-xs text-textSecondary">Modality:</span>
                  <select
                    value={modality}
                    onChange={(e) => setModality(e.target.value as Modality)}
                    className="bg-transparent border-none text-xs text-textPrimary focus:outline-none"
                  >
                    <option value="small_molecule">Small Molecule</option>
                    <option value="adc">ADC</option>
                    <option value="tce">TCE</option>
                  </select>
                </div>
              </div>

              {/* Validation Score */}
              <div className="p-4 bg-surfaceElevated border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-textPrimary">Validation Score</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-primary">4.5/5</span>
                    <span className="text-xs text-textSecondary">[Strong]</span>
                  </div>
                </div>
                <div className="w-full bg-surface rounded-full h-2">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
                    style={{ width: '90%' }}
                  />
                </div>
              </div>

              {/* Direction of Effect */}
              <div className="p-4 bg-surfaceElevated border border-white/10 rounded-lg">
                <h4 className="text-sm font-semibold text-textPrimary mb-3">
                  DIRECTION OF EFFECT
                </h4>
                <div className="space-y-2 mb-3">
                  <div className="text-sm text-textSecondary">
                    Proposed MOA: <span className="text-textPrimary font-medium">Inhibition</span>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-textSecondary">LoF Evidence</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-textPrimary">→ Supports</span>
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-textSecondary">GoF Evidence</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-textPrimary">→ Consistent</span>
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <span className="text-xs text-textSecondary">Confidence: </span>
                      <span className="text-xs font-medium text-success">HIGH</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Genetic Constraint */}
              <div className="p-4 bg-surfaceElevated border border-white/10 rounded-lg">
                <h4 className="text-sm font-semibold text-textPrimary mb-3">
                  GENETIC CONSTRAINT (gnomAD)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-textSecondary mb-1">pLI</div>
                    <div className="text-sm font-medium text-textPrimary">0.12 (tolerant)</div>
                    <CheckCircle className="w-4 h-4 text-success mt-1" />
                  </div>
                  <div>
                    <div className="text-xs text-textSecondary mb-1">LOEUF</div>
                    <div className="text-sm font-medium text-textPrimary">0.85</div>
                    <CheckCircle className="w-4 h-4 text-success mt-1" />
                  </div>
                </div>
                <p className="text-xs text-textSecondary mt-3">
                  → Chronic inhibition likely tolerated
                </p>
              </div>

              {/* Somatic Alterations */}
              <div className="p-4 bg-surfaceElevated border border-white/10 rounded-lg">
                <h4 className="text-sm font-semibold text-textPrimary mb-3">
                  SOMATIC ALTERATIONS (Oncology)
                </h4>
                <div className="space-y-3">
                  {[
                    { cancer: 'NSCLC', altered: 42 },
                    { cancer: 'Colorectal', altered: 23 },
                    { cancer: 'Pancreatic', altered: 51 },
                  ].map((row) => (
                    <div key={row.cancer} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-textPrimary">{row.cancer}</span>
                        <span className="text-sm text-textSecondary">{row.altered}% altered</span>
                      </div>
                      <div className="w-full bg-surface rounded-full h-2">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${row.altered}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tumor Dependency */}
              <div className="p-4 bg-surfaceElevated border border-white/10 rounded-lg">
                <h4 className="text-sm font-semibold text-textPrimary mb-3">
                  TUMOR DEPENDENCY (DepMap)
                </h4>
                <div className="space-y-2">
                  <div className="text-sm text-textSecondary">
                    Essential in: <span className="text-textPrimary font-medium">34%</span> of NSCLC
                    cell lines
                  </div>
                  <div className="text-sm text-textSecondary">
                    Dependency score:{' '}
                    <span className="text-textPrimary font-medium">-0.82</span> (strong dependency)
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Landscape Tab */}
          {activeTab === 'landscape' && (
            <motion.div
              key="landscape"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-textPrimary">Competitive Landscape</h3>
                <div className="px-3 py-1 bg-surfaceElevated border border-white/10 rounded-lg">
                  <span className="text-sm text-textSecondary">7 programs</span>
                </div>
              </div>

              {/* Pipeline by Phase */}
              <div className="p-4 bg-surfaceElevated border border-white/10 rounded-lg">
                <h4 className="text-sm font-semibold text-textPrimary mb-3">PIPELINE BY PHASE</h4>
                <div className="space-y-2">
                  {[
                    { phase: 'Approved', count: 2 },
                    { phase: 'Phase 3', count: 3 },
                    { phase: 'Phase 2', count: 1 },
                    { phase: 'Phase 1', count: 1 },
                  ].map((row) => (
                    <div key={row.phase} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-textPrimary">{row.phase}</div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-surface rounded-full h-2">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${(row.count / 3) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-textPrimary w-8 text-right">{row.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Modality */}
              <div className="p-4 bg-surfaceElevated border border-white/10 rounded-lg">
                <h4 className="text-sm font-semibold text-textPrimary mb-3">BY MODALITY</h4>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-textSecondary">Small Molecule:</span>
                  <span className="text-textPrimary font-medium">4</span>
                  <span className="text-textSecondary">|</span>
                  <span className="text-textSecondary">ADC:</span>
                  <span className="text-textPrimary font-medium">2</span>
                  <span className="text-textSecondary">|</span>
                  <span className="text-textSecondary">TCE:</span>
                  <span className="text-textPrimary font-medium">1</span>
                </div>
              </div>

              {/* Key Programs */}
              <div className="p-4 bg-surfaceElevated border border-white/10 rounded-lg">
                <h4 className="text-sm font-semibold text-textPrimary mb-3">KEY PROGRAMS</h4>
                <div className="space-y-2">
                  {[
                    { company: 'Amgen', drug: 'Sotorasib', phase: 'Approved', orr: 'ORR 37%' },
                    { company: 'Mirati', drug: 'Adagrasib', phase: 'Approved', orr: 'ORR 43%' },
                    { company: 'BMS', drug: 'BMS-xxxxx', phase: 'Phase 2', orr: 'Pending' },
                  ].map((program, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-surface rounded-lg border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-textPrimary">{program.company}</span>
                        <span className="text-sm text-textSecondary">|</span>
                        <span className="text-sm text-textPrimary">{program.drug}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 bg-surfaceElevated border border-white/10 rounded">
                          {program.phase}
                        </span>
                        <span className="text-sm text-textSecondary">{program.orr}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Failed Programs */}
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <h4 className="text-sm font-semibold text-warning">FAILED PROGRAMS</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-textPrimary mb-1">
                      • Company X (Phase 2): Lack of efficacy
                    </div>
                    <div className="text-textSecondary ml-4">
                      Lesson: Single-agent insufficient
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-textPrimary mb-1">
                      • Company Y (Phase 1): Hepatotoxicity
                    </div>
                    <div className="text-textSecondary ml-4">
                      Lesson: Off-target binding issue
                    </div>
                  </div>
                </div>
              </div>

              {/* Differentiation Opportunity */}
              <div className="p-4 bg-surfaceElevated border border-white/10 rounded-lg">
                <h4 className="text-sm font-semibold text-textPrimary mb-3">
                  DIFFERENTIATION OPPORTUNITY
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-textSecondary">Right to Win:</span>
                    <span className="text-sm font-medium text-warning">MODERATE</span>
                  </div>
                  <div className="text-sm text-textSecondary">
                    Key gaps: Resistance, CNS penetration, combos
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Interface for Agent Interaction */}
      <div className="border-t border-white/10 bg-surfaceElevated flex flex-col">
        {/* Chat Messages */}
        {chatMessages.length > 0 && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {chatMessages.map((message, idx) => (
              <div
                key={idx}
                className={`flex flex-col gap-2 ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  message.role === 'user'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-surface text-textSecondary'
                }`}>
                  {message.role === 'user' ? 'YOU' : '🧬 TARGET BIOLOGY SPECIALIST'}
                </div>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-surface border border-white/10'
                }`}>
                  <p className="text-sm text-textPrimary whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Example Questions - Show when no messages */}
        {chatMessages.length === 0 && targetSymbol && (
          <div className="p-6">
            <p className="text-sm text-textSecondary mb-2">Try asking:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                `What's the biological mechanism of ${targetSymbol}?`,
                `Assess the genetic validation for ${targetSymbol}`,
                `What's the druggability profile of ${targetSymbol}?`,
                `Evaluate safety concerns for ${targetSymbol}`,
              ].map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setChatInput(example);
                    setTimeout(() => handleChatSend(), 100);
                  }}
                  disabled={isChatProcessing || !isAuthenticated}
                  className="text-left px-3 py-2 text-xs text-textSecondary bg-surface border border-white/10 rounded-lg hover:border-primary/50 hover:text-textPrimary transition-colors disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input - Full width at bottom */}
        <div className="border-t border-white/10 p-4 space-y-3">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleChatSend();
              }
            }}
            placeholder={`Ask about ${targetSymbol || 'the target'}...`}
            rows={3}
            className="w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 resize-none transition-colors"
            disabled={isChatProcessing || !targetSymbol}
          />
          <button
            onClick={handleChatSend}
            disabled={!chatInput.trim() || isChatProcessing || !targetSymbol || isCheckingAuth}
            className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            {isChatProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send</span>
              </>
            )}
          </button>
          <p className="text-xs text-textTertiary text-center">
            Press ⌘+Enter or Ctrl+Enter to send
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 mx-6 mb-6 bg-danger/10 border border-danger/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setIsAuthenticated(true);
          setShowLoginModal(false);
        }}
      />
    </div>
  );
}

