/**
 * Patent Agent Interface Component
 * Comprehensive UI for patent analysis with multiple states:
 * - Upload/Entry selection
 * - File upload with drag & drop
 * - Patent number entry
 * - Analysis progress
 * - Results summary
 * - Conversational follow-up
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  Loader2,
  X,
  Search,
  Link,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Shield,
  ChevronRight,
  Plus,
  Download,
  Sparkles,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import type { PatentExtractionResult } from '../../lib/patentParsing/types';
import type { QualityAssessment } from '../../lib/patentParsing/qualityAssurance';
import { downloadJsonFile, downloadTextFile, openPrintPreview } from '../../lib/reportExport';
import CreateTileModal from '../CreateTileModal';
import LoginModal from '../shared/LoginModal';
import VerificationPrompt, { type VerificationItem } from './VerificationPrompt';
import PatentQuickActionsMenu from './PatentQuickActionsMenu';
import PatentFullAnalysisPanel from './PatentFullAnalysisPanel';
import ClaimsExtractionPanel from './ClaimsExtractionPanel';
import SequenceExtractionPanel from './SequenceExtractionPanel';

// Analysis modes
export type AnalysisMode = 'quick' | 'comprehensive' | 'deep';

interface AnalysisOptions {
  mode: AnalysisMode;
  therapeuticArea?: string;
}

interface RecentPatent {
  id: string;
  number: string;
  title: string;
  analyzedAt: string;
  parsedResult?: PatentExtractionResult;
  qualityAssessment?: QualityAssessment;
  ftoRiskData?: {
    level: 'low' | 'moderate' | 'high';
    label: string;
    color: string;
    score: number;
    concerns: any[];
    recommendations: string[];
  };
  tileId?: string; // Link to created tile
}

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  details?: string;
}

interface PatentAgentInterfaceProps {
  onResult?: (result: PatentExtractionResult) => void;
  className?: string;
  onBackToChat?: () => void;
}

const THERAPEUTIC_AREAS = [
  'Oncology',
  'Immunology',
  'Neurology',
  'Cardiovascular',
  'Metabolic',
  'Infectious Disease',
  'Rare Disease',
  'Other',
];

const ANALYSIS_MODES: Record<AnalysisMode, { label: string; time: string; description: string }> = {
  quick: {
    label: 'Quick Scan',
    time: '~2 min',
    description: 'Claims + key data',
  },
  comprehensive: {
    label: 'Comprehensive',
    time: '~5-8 min',
    description: 'Full extraction + sequences',
  },
  deep: {
    label: 'Deep Analysis',
    time: '~15 min',
    description: '+ competitive context',
  },
};

export default function PatentAgentInterface({ onResult, className = '', onBackToChat }: PatentAgentInterfaceProps) {
  // State management
  const [currentState, setCurrentState] = useState<'selection' | 'upload' | 'entry' | 'progress' | 'results' | 'chat'>('selection');
  
  // Listen for restore analysis events from RecentPatentAnalysisList
  useEffect(() => {
    const handleRestore = (event: CustomEvent) => {
      const patent = event.detail as RecentPatent;
      if (patent.parsedResult) {
        setParsedResult(patent.parsedResult);
        if (patent.qualityAssessment) {
          setQualityAssessment(patent.qualityAssessment);
        }
        if (patent.ftoRiskData) {
          setFtoRiskData(patent.ftoRiskData);
        }
        setCurrentState('results');
      }
    };

    window.addEventListener('restore-patent-analysis', handleRestore as EventListener);
    return () => {
      window.removeEventListener('restore-patent-analysis', handleRestore as EventListener);
    };
  }, []);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patentNumbers, setPatentNumbers] = useState<string>('');
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({ mode: 'comprehensive' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [parsedResult, setParsedResult] = useState<PatentExtractionResult | null>(null);
  const [qualityAssessment, setQualityAssessment] = useState<QualityAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentPatents, setRecentPatents] = useState<RecentPatent[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showCreateTileModal, setShowCreateTileModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'agent'; content: string; timestamp: Date }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [ftoRiskData, setFtoRiskData] = useState<{
    level: 'low' | 'moderate' | 'high';
    label: string;
    color: string;
    score: number;
    concerns: any[];
    recommendations: string[];
  } | null>(null);
  const [verificationItems, setVerificationItems] = useState<VerificationItem[]>([]);
  const [currentVerificationIndex, setCurrentVerificationIndex] = useState<number | null>(null);
  const [showFullAnalysisPanel, setShowFullAnalysisPanel] = useState(false);
  const [activeDetailPanel, setActiveDetailPanel] = useState<'claims' | 'sequences' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Check authentication status on mount and when login modal closes
  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      try {
        const response = await fetch('/api/auth-check', {
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
  }, [showLoginModal]); // Re-check when login modal closes

  // Load recent patents from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lumina-recent-patents');
    if (stored) {
      try {
        setRecentPatents(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load recent patents:', e);
      }
    }
  }, []);

  // Save recent patent with full analysis data
  const saveRecentPatent = useCallback((result: PatentExtractionResult, tileId?: string) => {
    if (!result.document_info.patent_number) return;

    const newPatent: RecentPatent = {
      id: result.document_info.patent_number,
      number: result.document_info.patent_number,
      title: result.document_info.title || 'Untitled Patent',
      analyzedAt: new Date().toISOString(),
      parsedResult: result, // Store full analysis result
      qualityAssessment: qualityAssessment || undefined,
      ftoRiskData: ftoRiskData || undefined,
      tileId: tileId, // Link to created tile
    };

    setRecentPatents((prev) => {
      const updated = [newPatent, ...prev.filter((p) => p.id !== newPatent.id)].slice(0, 10);
      localStorage.setItem('lumina-recent-patents', JSON.stringify(updated));
      // Dispatch event to notify RecentPatentAnalysisList
      window.dispatchEvent(new Event('patent-analysis-saved'));
      return updated;
    });
  }, [qualityAssessment, ftoRiskData]);

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

    const files = Array.from(e.dataTransfer.files);
    const file = files.find((f) => 
      ['application/pdf', 'application/xml', 'text/xml', 'text/html', 
       'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
       'text/plain'].includes(f.type)
    );

    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50MB limit.');
        return;
      }
      setSelectedFile(file);
      setCurrentState('upload');
      setError(null);
    } else {
      setError('Invalid file type. Please upload PDF, XML, HTML, DOCX, or TXT files.');
    }
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/xml',
      'text/xml',
      'text/html',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, XML, HTML, DOCX, or TXT files.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit.');
      return;
    }

    setSelectedFile(file);
    setCurrentState('upload');
    setError(null);
  }, []);

  // Initialize progress steps
  const initializeProgressSteps = useCallback(() => {
    const steps: ProgressStep[] = [
      { id: 'validate', label: 'Document validated', status: 'pending' },
      { id: 'claims', label: 'Claims identified', status: 'pending' },
      { id: 'sequences', label: 'Extracting sequences...', status: 'pending' },
      { id: 'databases', label: 'Cross-referencing databases', status: 'pending' },
      { id: 'analysis', label: 'Generating analysis', status: 'pending' },
    ];
    setProgressSteps(steps);
  }, []);

  // Get FTO Risk level (fetch from API)
  const getFTORisk = useCallback(async (result: PatentExtractionResult): Promise<{ level: 'low' | 'moderate' | 'high'; label: string; color: string; score: number; concerns: any[]; recommendations: string[] }> => {
    try {
      const response = await fetch('/api/patent-parsing/fto-risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patentData: result,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return {
          level: data.riskLevel,
          label: data.riskLevel.charAt(0).toUpperCase() + data.riskLevel.slice(1),
          color: data.riskLevel === 'low' ? 'green' : data.riskLevel === 'moderate' ? 'yellow' : 'red',
          score: data.riskScore,
          concerns: data.concerns || [],
          recommendations: data.recommendations || [],
        };
      }
    } catch (err) {
      console.error('FTO risk calculation error:', err);
    }

    // Fallback
    return {
      level: 'moderate',
      label: 'Moderate',
      color: 'yellow',
      score: 0.5,
      concerns: [],
      recommendations: [],
    };
  }, []);

  // Handle SSE progress updates
  const handleSSEProgress = useCallback(async (response: Response) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const eventData = line.substring(6);
          try {
            const event = JSON.parse(eventData);

            if (event.type === 'progress') {
              setProgress(event.data.progress || 0);
              if (event.data.message) {
                // Update step message if provided
              }
            } else if (event.type === 'step') {
              setProgressSteps((prev) => {
                const updated = [...prev];
                const stepIndex = updated.findIndex((s) => s.id === event.data.step);
                if (stepIndex >= 0) {
                  updated[stepIndex] = {
                    ...updated[stepIndex],
                    status: event.data.status,
                    label: event.data.message || updated[stepIndex].label,
                  };
                }
                return updated;
              });
              if (event.data.progress) {
                setProgress(event.data.progress);
              }
            } else if (event.type === 'live_update') {
              // Handle live updates (e.g., sequences found)
              // Could add to a live updates array for display
              console.log('Live update:', event.data);
            } else if (event.type === 'verification_needed') {
              // Add verification item to queue
              const verificationItem: VerificationItem = {
                id: event.data.id || `verify-${Date.now()}`,
                field: event.data.field || 'unknown',
                label: event.data.label || 'Value extraction',
                extractedValue: event.data.extractedValue || '',
                confidence: event.data.confidence || 0.5,
                alternatives: event.data.alternatives || [],
                context: event.data.context,
                section: event.data.section,
                pageNumber: event.data.pageNumber,
              };
              setVerificationItems((prev) => [...prev, verificationItem]);
              // Show first verification if none is currently being shown
              if (currentVerificationIndex === null) {
                setCurrentVerificationIndex(0);
              }
            } else if (event.type === 'complete') {
              const result = event.data.result;
              if (result && result.extraction && result.quality) {
                setParsedResult(result.extraction);
                setQualityAssessment(result.quality);
                
                // Store LLM analysis if available
                if (result.llmAnalysis) {
                  // Store in state for display in full analysis panel
                  (result.extraction as any).llmAnalysis = result.llmAnalysis;
                }
                
                // Calculate FTO risk first, then save with all data
                getFTORisk(result.extraction).then((ftoResult) => {
                  setFtoRiskData(ftoResult);
                  // Save recent patent with all analysis data after FTO is calculated
                  saveRecentPatent(result.extraction);
                });
                
                setCurrentState('results');
                
                if (onResult) {
                  onResult(result.extraction);
                }
              }
              setIsProcessing(false);
              setProgress(100);
              setEstimatedTime(0);
              return;
            } else if (event.type === 'error') {
              setError(event.data.message || 'An error occurred');
              setCurrentState(selectedFile ? 'upload' : 'entry');
              setIsProcessing(false);
              return;
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    }
  }, [selectedFile, onResult, saveRecentPatent, getFTORisk]);

  // Handle file upload and parsing with SSE
  const handleUploadAndParse = useCallback(async () => {
    if (!selectedFile) return;

    // Check authentication before proceeding
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    setIsProcessing(true);
    setCurrentState('progress');
    setError(null);
    initializeProgressSteps();

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('extract_structures', 'true');
      formData.append('extract_sequences', 'true');
      formData.append('extract_biological_data', 'true');
      formData.append('resolve_cross_references', 'true');
      formData.append('validate_data', 'true');
      formData.append('mode', analysisOptions.mode);
      formData.append('useSSE', 'true');

      const response = await fetch('/api/patent-parsing/parse', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Accept': 'text/event-stream',
        },
      });

      if (!response.ok) {
        // Check if it's an authentication error
        if (response.status === 401) {
          setIsAuthenticated(false);
          setShowLoginModal(true);
          setError('Authentication required. Please log in to analyze patents.');
          setCurrentState('upload');
          setIsProcessing(false);
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse patent document' }));
        throw new Error(errorData.error || 'Failed to parse patent document');
      }

              // Handle SSE stream (FTO risk is calculated inside handleSSEProgress when complete event is received)
      await handleSSEProgress(response);
    } catch (err: any) {
      console.error('Patent parsing error:', err);
      setError(err.message || 'Failed to parse patent document');
      setCurrentState('upload');
      setIsProcessing(false);
      setProgress(0);
      setEstimatedTime(0);
    }
  }, [selectedFile, analysisOptions, onResult, initializeProgressSteps, handleSSEProgress, saveRecentPatent, getFTORisk, isAuthenticated]);

  // Handle patent number fetch and analysis
  const handlePatentNumberAnalysis = useCallback(async () => {
    if (!patentNumbers.trim()) {
      setError('Please enter at least one patent number');
      return;
    }

    setIsProcessing(true);
    setCurrentState('progress');
    setError(null);
    initializeProgressSteps();

    try {
      // Parse patent numbers (comma or line separated)
      const numbers = patentNumbers
        .split(/[,\n]/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      // Fetch patents from USPTO/EPO
      const fetchResponse = await fetch('/api/patent-parsing/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patentNumbers: numbers,
          mode: analysisOptions.mode,
          therapeuticArea: analysisOptions.therapeuticArea,
        }),
        credentials: 'include',
      });

      if (!fetchResponse.ok) {
        // Check if it's an authentication error
        if (fetchResponse.status === 401) {
          setIsAuthenticated(false);
          setShowLoginModal(true);
          setError('Authentication required. Please log in to fetch patents.');
          setCurrentState('entry');
          setIsProcessing(false);
          return;
        }
        const errorData = await fetchResponse.json();
        throw new Error(errorData.error || 'Failed to fetch patents');
      }

      const fetchData = await fetchResponse.json();

      // Check if any patents were found
      const foundPatents = fetchData.patents?.filter((p: any) => p.status === 'found');
      
      if (foundPatents.length === 0) {
        setError('No patents found. Please check patent numbers or upload PDF files.');
        setCurrentState('entry');
        setIsProcessing(false);
        return;
      }

      // For now, show message that fetching is implemented but parsing from fetched data needs work
      // In full implementation, would parse the fetched patent documents
      setError('Patent fetching is implemented, but automatic parsing from fetched data requires additional work. Please upload PDF files for now.');
      setCurrentState('entry');
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Patent number analysis error:', err);
      setError(err.message || 'Failed to fetch patent');
      setCurrentState('entry');
      setIsProcessing(false);
    }
  }, [patentNumbers, analysisOptions, initializeProgressSteps, isAuthenticated]);

  // Handle chat message
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
      // Build messages array for API
      const apiMessages = [
        ...chatMessages.slice(-5).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user' as const, content: currentInput },
      ];

      const response = await fetch('/api/agents/patent-expert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          documents: parsedResult ? [{
            fileName: parsedResult.document_info.patent_number || 'Patent Document',
            name: parsedResult.document_info.patent_number || 'Patent Document',
            text: JSON.stringify(parsedResult),
          }] : [],
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from patent agent');
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
        content: `Error: ${err.message || 'Failed to get response from patent agent'}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [chatInput, chatMessages, parsedResult]);

  // Calculate IP Strength (0-100)
  const calculateIPStrength = useCallback((result: PatentExtractionResult): number => {
    let score = 0;
    
    // Claims count (max 30 points)
    const totalClaims = result.claims_analysis.total_claims;
    score += Math.min(30, (totalClaims / 50) * 30);
    
    // Independent claims (max 20 points)
    const independentClaims = result.claims_analysis.independent_claims;
    score += Math.min(20, (independentClaims / 10) * 20);
    
    // Sequences found (max 25 points)
    const sequences = result.molecular_data.sequences;
    const totalSequences = 
      sequences.antibodies.length +
      sequences.nucleic_acids.length +
      sequences.small_molecules.length;
    score += Math.min(25, (totalSequences / 20) * 25);
    
    // Quality confidence (max 25 points)
    if (qualityAssessment) {
      score += qualityAssessment.overall_confidence * 25;
    }
    
    return Math.round(Math.min(100, score));
  }, [qualityAssessment]);

  // Reset to initial state
  const handleCancel = useCallback(() => {
    setCurrentState('selection');
    setSelectedFile(null);
    setPatentNumbers('');
    setError(null);
    setProgress(0);
    setProgressSteps([]);
    setEstimatedTime(0);
  }, []);

  // Format time remaining
  const formatTimeRemaining = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Detail Panels - Show when active */}
      {activeDetailPanel === 'claims' && (
        <ClaimsExtractionPanel
          patent={parsedResult}
          onBack={() => setActiveDetailPanel(null)}
          onExtract={(options) => {
            // TODO: Trigger claims extraction with selected options
            console.log('Extract claims with options:', options);
          }}
        />
      )}

      {activeDetailPanel === 'sequences' && (
        <SequenceExtractionPanel
          patent={parsedResult}
          onBack={() => setActiveDetailPanel(null)}
          onExtract={(options) => {
            // TODO: Trigger sequence extraction with selected options
            console.log('Extract sequences with options:', options);
          }}
        />
      )}

      {/* Main Interface - Show when no detail panel is active */}
      {!activeDetailPanel && (
        <AnimatePresence mode="wait">
          {/* State 1: Selection (Upload vs Entry) */}
          {currentState === 'selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col p-4 overflow-y-auto"
          >
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="w-full max-w-md space-y-4">
                {/* Upload Option */}
                <button
                  onClick={() => setCurrentState('upload')}
                  className="w-full p-4 bg-surfaceElevated border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-surface transition-all group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-textPrimary mb-1">Upload Patent PDF</h3>
                      <p className="text-sm text-textSecondary">Drop patent PDF here or click to browse</p>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-textTertiary">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Patent Number Entry Option */}
                <button
                  onClick={() => setCurrentState('entry')}
                  className="w-full p-4 bg-surfaceElevated border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-surface transition-all group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <Link className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-textPrimary mb-1">Enter Patent Number</h3>
                      <p className="text-sm text-textSecondary">Fetch from USPTO/EPO by patent number</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Recent Patents */}
              {recentPatents.length > 0 && (
                <div className="w-full max-w-md mt-8">
                  <h4 className="text-sm font-medium text-textSecondary mb-3">Recent patents:</h4>
                  <div className="space-y-2">
                    {recentPatents.slice(0, 3).map((patent) => (
                      <button
                        key={patent.id}
                        onClick={() => {
                          setPatentNumbers(patent.number);
                          setCurrentState('entry');
                        }}
                        className="w-full p-3 bg-surfaceElevated border border-border rounded-lg hover:border-primary/50 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-textTertiary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-textPrimary truncate">{patent.number}</p>
                            <p className="text-xs text-textSecondary truncate">{patent.title}</p>
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-textTertiary group-hover:text-primary transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* State 2: Upload Interface */}
        {currentState === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col p-4 overflow-y-auto"
          >
            <div className="space-y-6">
              {/* Drag & Drop Area */}
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.xml,.html,.docx,.txt"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                />
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    isDragging ? 'bg-primary/20' : 'bg-surfaceElevated'
                  } transition-colors`}>
                    <FileText className={`w-10 h-10 ${isDragging ? 'text-primary' : 'text-textTertiary'}`} />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-textPrimary mb-1">
                      {selectedFile ? selectedFile.name : 'Drop patent PDF here'}
                    </p>
                    <p className="text-sm text-textSecondary">
                      {selectedFile ? 'or click to select a different file' : 'or click to browse'}
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textSecondary hover:text-textPrimary hover:border-primary/50 transition-colors"
                  >
                    Browse Files
                  </button>
                  <p className="text-xs text-textTertiary mt-2">
                    Supports: PDF, XML, DOCX
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-textTertiary">or enter patent #</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Patent Number Entry */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={patentNumbers}
                  onChange={(e) => setPatentNumbers(e.target.value)}
                  placeholder="US10808039, EP3456789..."
                  className="w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-primary/50"
                  disabled={isProcessing}
                />
                <button
                  onClick={() => {
                    if (patentNumbers.trim()) {
                      setCurrentState('entry');
                    }
                  }}
                  disabled={!patentNumbers.trim() || isProcessing}
                  className="w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-textPrimary hover:border-primary/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-4 h-4" />
                  <span>Fetch from USPTO/EPO</span>
                </button>
              </div>

              {/* Recent Patents */}
              {recentPatents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-textSecondary mb-3">Recent patents:</h4>
                  <div className="space-y-2">
                    {recentPatents.slice(0, 2).map((patent) => (
                      <button
                        key={patent.id}
                        onClick={() => {
                          setPatentNumbers(patent.number);
                          setCurrentState('entry');
                        }}
                        className="w-full p-3 bg-surfaceElevated border border-border rounded-lg hover:border-primary/50 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-textTertiary" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-textPrimary">{patent.number}</p>
                            <p className="text-xs text-textSecondary">{patent.title}</p>
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-textTertiary group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 text-textSecondary hover:text-textPrimary transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              {/* Upload Button (when file selected) */}
              {selectedFile && (
                <>
                  <button
                    onClick={handleUploadAndParse}
                    disabled={isProcessing || isCheckingAuth}
                    className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : isCheckingAuth ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Checking authentication...</span>
                      </>
                    ) : !isAuthenticated ? (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>Login Required to Analyze</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Upload & Analyze</span>
                      </>
                    )}
                  </button>
                  
                  {/* Authentication Status Banner */}
                  {!isCheckingAuth && !isAuthenticated && (
                    <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                      <p className="text-xs text-textSecondary">
                        <strong className="text-warning">⚠️ Authentication Required:</strong> Please log in to analyze patent documents. Click the button above to authenticate.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* State 3: Patent Number Entry */}
        {currentState === 'entry' && (
          <motion.div
            key="entry"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col p-4 overflow-y-auto"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Enter patent number(s):
                </label>
                <textarea
                  value={patentNumbers}
                  onChange={(e) => setPatentNumbers(e.target.value)}
                  placeholder="US10808039B2"
                  rows={4}
                  className="w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-primary/50 resize-none"
                  disabled={isProcessing}
                />
                <p className="text-xs text-textTertiary mt-2">
                  One patent per line or comma-separated
                </p>
              </div>

              <button
                onClick={handlePatentNumberAnalysis}
                disabled={!patentNumbers.trim() || isProcessing || isCheckingAuth}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : isCheckingAuth ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Checking authentication...</span>
                  </>
                ) : !isAuthenticated ? (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Login Required to Fetch</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Fetch & Analyze</span>
                  </>
                )}
              </button>
              
              {/* Authentication Status Banner */}
              {!isCheckingAuth && !isAuthenticated && (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <p className="text-xs text-textSecondary">
                    <strong className="text-warning">⚠️ Authentication Required:</strong> Please log in to fetch and analyze patents. Click the button above to authenticate.
                  </p>
                </div>
              )}

              {/* Analysis Options */}
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-3">
                  Analysis options:
                </label>
                <div className="space-y-3">
                  {(Object.keys(ANALYSIS_MODES) as AnalysisMode[]).map((mode) => (
                    <label
                      key={mode}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        analysisOptions.mode === mode
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-border'
                      }`}
                    >
                      <input
                        type="radio"
                        name="analysis-mode"
                        value={mode}
                        checked={analysisOptions.mode === mode}
                        onChange={() => setAnalysisOptions((prev) => ({ ...prev, mode }))}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-textPrimary">{ANALYSIS_MODES[mode].label}</span>
                          <span className="text-xs text-textSecondary">{ANALYSIS_MODES[mode].time}</span>
                        </div>
                        <p className="text-xs text-textSecondary">{ANALYSIS_MODES[mode].description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Therapeutic Area */}
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Therapeutic area:
                </label>
                <select
                  value={analysisOptions.therapeuticArea || ''}
                  onChange={(e) => setAnalysisOptions((prev) => ({ ...prev, therapeuticArea: e.target.value || undefined }))}
                  className="w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-textPrimary focus:outline-none focus:border-primary/50"
                >
                  <option value="">Select area...</option>
                  {THERAPEUTIC_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 text-textSecondary hover:text-textPrimary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePatentNumberAnalysis}
                  disabled={!patentNumbers.trim() || isProcessing}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* State 4: Progress */}
        {currentState === 'progress' && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col p-4 overflow-y-auto"
          >
            {/* Verification Prompts - Show during progress if needed */}
            {currentVerificationIndex !== null && verificationItems[currentVerificationIndex] && (
              <div className="mb-6">
                <VerificationPrompt
                  item={verificationItems[currentVerificationIndex]}
                  onVerify={(value) => {
                    // Update the extraction result with verified value
                    // TODO: Send verification back to server to update extraction
                    console.log('Verified value:', value);
                    
                    // Move to next verification or continue
                    if (currentVerificationIndex < verificationItems.length - 1) {
                      setCurrentVerificationIndex(currentVerificationIndex + 1);
                    } else {
                      setCurrentVerificationIndex(null);
                      // Continue with analysis
                    }
                  }}
                  onSkip={() => {
                    // Skip this verification, use best guess
                    if (currentVerificationIndex < verificationItems.length - 1) {
                      setCurrentVerificationIndex(currentVerificationIndex + 1);
                    } else {
                      setCurrentVerificationIndex(null);
                    }
                  }}
                  onViewOriginal={() => {
                    // TODO: Open PDF viewer at specific page/section
                    console.log('View original PDF section');
                  }}
                />
              </div>
            )}

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full max-w-lg space-y-6">
                {/* Header */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-textPrimary mb-2">📋 PATENT EXPERT</h3>
                  <p className="text-sm text-textSecondary">
                    {selectedFile 
                      ? `Analyzing ${selectedFile.name}...`
                      : patentNumbers 
                      ? `Analyzing ${patentNumbers.split(/[,\n]/)[0]}...`
                      : 'Analyzing patent...'}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full bg-surfaceElevated rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-cyan-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-textSecondary">{progress}%</span>
                    {estimatedTime > 0 && (
                      <span className="text-textSecondary flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Est. time remaining: {formatTimeRemaining(estimatedTime)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="space-y-3">
                  {progressSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        step.status === 'completed'
                          ? 'bg-success/10 border border-success/20'
                          : step.status === 'in_progress'
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-surfaceElevated border border-border'
                      }`}
                    >
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      ) : step.status === 'in_progress' ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-textTertiary flex-shrink-0" />
                      )}
                      <span className={`text-sm ${
                        step.status === 'completed'
                          ? 'text-success'
                          : step.status === 'in_progress'
                          ? 'text-primary'
                          : 'text-textSecondary'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Live Updates Placeholder */}
                {progressSteps.find((s) => s.id === 'sequences' && s.status === 'in_progress') && (
                  <div className="p-4 bg-surfaceElevated border border-primary/20 rounded-lg">
                    <p className="text-xs text-textSecondary mb-2">Live:</p>
                    <div className="p-3 bg-surface rounded border border-border">
                      <p className="text-sm text-textPrimary font-mono">
                        Extracted HCDR3 sequence ARDLGRGAFDI (SEQ ID NO: 3)
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-textSecondary">Confidence:</span>
                        <span className="text-xs font-medium text-success">98%</span>
                        <CheckCircle className="w-3 h-3 text-success" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Follow-up Question Input */}
                <div className="pt-4 border-t border-border">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    rows={2}
                    className="w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>

                {/* Cancel Button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setIsProcessing(false);
                      setCurrentState(selectedFile ? 'upload' : 'entry');
                    }}
                    className="px-4 py-2 text-textSecondary hover:text-textPrimary transition-colors"
                  >
                    Cancel Analysis
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* State 5: Results Summary */}
        {currentState === 'results' && parsedResult && qualityAssessment && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col p-4 overflow-y-auto"
          >
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="p-4 bg-surfaceElevated border border-border rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-textPrimary">📋 PATENT EXPERT</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg">
                      <span className="text-xs font-medium text-primary">
                        {parsedResult.document_info.patent_number || 'Patent Analysis'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-success">Analysis Complete</span>
                    </div>
                    <PatentQuickActionsMenu
                      patentData={parsedResult}
                      onViewFull={() => setShowFullAnalysisPanel(true)}
                      onViewSequences={() => {
                        setActiveDetailPanel('sequences');
                      }}
                      onViewFTO={() => {
                        setShowFullAnalysisPanel(true);
                        // TODO: Set active tab to FTO in full panel
                      }}
                      onCompare={() => {
                        // TODO: Implement compare functionality
                        console.log('Compare patent');
                      }}
                      onSwitchToAgent={(agent) => {
                        // Store context and trigger agent switch
                        if (onBackToChat) {
                          onBackToChat();
                        }
                        // Dispatch event to switch agent with context
                        window.dispatchEvent(new CustomEvent('switch-agent-with-context', {
                          detail: {
                            targetAgent: agent,
                            context: {
                              fromAgent: 'patent',
                              patentData: {
                                patentNumber: parsedResult.document_info.patent_number || '',
                                antibodiesCount: parsedResult.molecular_data.sequences.antibodies.length,
                                sequencesAvailable: parsedResult.molecular_data.sequences.antibodies.length > 0 ||
                                                  parsedResult.molecular_data.sequences.nucleic_acids.length > 0,
                                ftoRisk: ftoRiskData?.level,
                              },
                              analysisData: parsedResult,
                            },
                          },
                        }));
                      }}
                      onExport={() => {
                        if (!parsedResult) return;
                        const now = new Date();
                        const dateStamp = now.toISOString().split('T')[0];
                        const patentNumber = parsedResult.document_info.patent_number || 'patent';
                        const safeBase = `patent-${patentNumber}-${dateStamp}`.replace(/[^a-zA-Z0-9-_]+/g, '-');
                        const title = `Patent Analysis • ${patentNumber}`;

                        const claimCounts = parsedResult.claims_analysis
                          ? {
                              total_claims: parsedResult.claims_analysis.total_claims,
                              independent_claims: parsedResult.claims_analysis.independent_claims,
                            }
                          : undefined;

                        const sequenceCounts = parsedResult.molecular_data?.sequences
                          ? {
                              antibodies: parsedResult.molecular_data.sequences.antibodies.length,
                              nucleic_acids: parsedResult.molecular_data.sequences.nucleic_acids.length,
                              small_molecules: parsedResult.molecular_data.sequences.small_molecules.length,
                            }
                          : undefined;

                        const markdown = [
                          `# ${title}`,
                          '',
                          `Generated: ${now.toLocaleString()}`,
                          '',
                          '## Document Info',
                          '```json',
                          JSON.stringify(parsedResult.document_info ?? {}, null, 2),
                          '```',
                          '',
                          '## Highlights',
                          '```json',
                          JSON.stringify({ claimCounts, sequenceCounts, ftoRisk: ftoRiskData?.level }, null, 2),
                          '```',
                          '',
                          '## Key Data (JSON)',
                          '```json',
                          JSON.stringify({ parsedResult, qualityAssessment, ftoRiskData }, null, 2),
                          '```',
                          '',
                        ].join('\n');

                        // Provide a practical set of exports: JSON download + print-to-PDF.
                        downloadJsonFile(`${safeBase}.json`, { parsedResult, qualityAssessment, ftoRiskData });
                        downloadTextFile(`${safeBase}.md`, markdown, 'text/markdown;charset=utf-8');
                        openPrintPreview(title, markdown);
                      }}
                      onRemove={() => {
                        if (window.confirm('Remove this analysis?')) {
                          setParsedResult(null);
                          setQualityAssessment(null);
                          setFtoRiskData(null);
                          setCurrentState('selection');
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Patent Info Card */}
                <div className="p-4 bg-surface rounded-lg border border-border mb-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-textPrimary">
                      {parsedResult.document_info.patent_number || 'Unknown Patent'}
                    </h4>
                    <p className="text-sm text-textSecondary">
                      {parsedResult.document_info.title || 'No title available'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-textTertiary">
                      {parsedResult.document_info.assignee && (
                        <span>{parsedResult.document_info.assignee}</span>
                      )}
                      {parsedResult.document_info.publication_date && (
                        <span>• Exp: {new Date(parsedResult.document_info.publication_date).getFullYear() + 20}</span>
                      )}
                    </div>
                  </div>

                  {/* IP Strength & FTO Risk */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-textSecondary">IP Strength</span>
                        <span className="text-sm font-semibold text-textPrimary">
                          {calculateIPStrength(parsedResult)}
                        </span>
                      </div>
                      <div className="w-full bg-surfaceElevated rounded-full h-2">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
                          style={{ width: `${calculateIPStrength(parsedResult)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-textSecondary">FTO Risk</span>
                        <span className={`text-sm font-semibold ${
                          ftoRiskData?.level === 'low' ? 'text-success' :
                          ftoRiskData?.level === 'moderate' ? 'text-warning' : 'text-danger'
                        }`}>
                          {ftoRiskData?.label || 'Moderate'}
                        </span>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        ftoRiskData?.level === 'low' ? 'bg-success' :
                        ftoRiskData?.level === 'moderate' ? 'bg-warning' : 'bg-danger'
                      }`} />
                    </div>
                  </div>
                </div>

                {/* Key Findings */}
                <div>
                  <h4 className="text-sm font-semibold text-textPrimary mb-3">Key Findings:</h4>
                  <ul className="space-y-2 text-sm text-textSecondary">
                    <li className="flex items-center gap-2">
                      <span>•</span>
                      <span>
                        {parsedResult.claims_analysis.total_claims} claims ({parsedResult.claims_analysis.independent_claims} independent)
                      </span>
                    </li>
                    {parsedResult.molecular_data.sequences.antibodies.length > 0 && (
                      <li className="flex items-center gap-2">
                        <span>•</span>
                        <span>
                          {parsedResult.molecular_data.sequences.antibodies.length} antibodies extracted
                        </span>
                      </li>
                    )}
                    {(parsedResult.molecular_data.sequences.antibodies.length +
                      parsedResult.molecular_data.sequences.nucleic_acids.length) > 0 && (
                      <li className="flex items-center gap-2">
                        <span>•</span>
                        <span>
                          {parsedResult.molecular_data.sequences.antibodies.length +
                           parsedResult.molecular_data.sequences.nucleic_acids.length} sequences validated
                        </span>
                      </li>
                    )}
                    {parsedResult.validation_flags.length > 0 && (
                      <li className="flex items-center gap-2 text-warning">
                        <AlertCircle className="w-4 h-4" />
                        <span>
                          ⚠️ {parsedResult.validation_flags.length} validation flag{parsedResult.validation_flags.length > 1 ? 's' : ''}
                        </span>
                      </li>
                    )}
                    {ftoRiskData && ftoRiskData.concerns.length > 0 && (
                      <li className="flex items-center gap-2 text-warning">
                        <AlertCircle className="w-4 h-4" />
                        <span>
                          ⚠️ {ftoRiskData.concerns.length} FTO concern{ftoRiskData.concerns.length > 1 ? 's' : ''} identified
                        </span>
                      </li>
                    )}
                  </ul>
                </div>

                <button
                  onClick={() => setCurrentState('chat')}
                  className="w-full mt-4 px-4 py-2 bg-surface border border-border rounded-lg text-textPrimary hover:border-primary/50 transition-colors text-sm font-medium"
                >
                  View Full Analysis
                </button>
              </div>

              {/* Action Buttons */}
              <div>
                <p className="text-sm font-medium text-textSecondary mb-3">What would you like to explore?</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowCreateTileModal(true)}
                    className="w-full p-3 bg-primary/20 border border-primary/30 rounded-lg hover:border-primary/50 hover:bg-primary/30 transition-colors text-left text-sm text-textPrimary font-medium flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                    Add to Dashboard
                  </button>
                  {[
                    { icon: '🧬', label: 'Show extracted sequences' },
                    { icon: '⚖️', label: 'Explain the FTO risk' },
                    { icon: '📊', label: 'Compare to competitor patents' },
                  ].map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setChatInput(action.label);
                        setCurrentState('chat');
                      }}
                      className="w-full p-3 bg-surfaceElevated border border-border rounded-lg hover:border-primary/50 transition-colors text-left text-sm text-textPrimary"
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <div>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      setCurrentState('chat');
                    }
                  }}
                  placeholder="Ask about this patent..."
                  rows={3}
                  className="w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* State 6: Conversational Follow-up */}
        {currentState === 'chat' && parsedResult && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col p-4 overflow-y-auto"
          >
            {/* Back Button */}
            <button
              onClick={() => {
                // Preserve analysis state when going back
                if (parsedResult) {
                  setCurrentState('results');
                } else if (onBackToChat) {
                  onBackToChat();
                }
              }}
              className="mb-4 flex items-center gap-2 text-sm text-textSecondary hover:text-textPrimary transition-colors self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              {parsedResult ? 'Back to Results' : 'Back to Chat'}
            </button>
            
            <div className="flex-1 space-y-4 mb-4">
              {/* Chat Messages */}
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-textSecondary mb-4">
                    Start a conversation about this patent
                  </p>
                </div>
              )}

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
                      : 'bg-surfaceElevated text-textSecondary'
                  }`}>
                    {message.role === 'user' ? 'YOU' : '📋 PATENT EXPERT'}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-surfaceElevated border border-border'
                  }`}>
                    <p className="text-sm text-textPrimary whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="border-t border-border pt-4">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleChatSend();
                  }
                }}
                placeholder="Ask follow-up..."
                rows={3}
                className="w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-primary/50 resize-none"
              />
              <p className="text-xs text-textTertiary mt-2">
                Press ⌘+Enter or Ctrl+Enter to send
              </p>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      )}

      {/* Create Tile Modal */}
      {parsedResult && qualityAssessment && (
        <CreateTileModal
          isOpen={showCreateTileModal}
          onClose={() => setShowCreateTileModal(false)}
          onSuccess={(tileId) => {
            console.log('Tile created:', tileId);
            // Save recent patent with tile ID for linking
            if (parsedResult) {
              saveRecentPatent(parsedResult, tileId);
            }
            setShowCreateTileModal(false);
          }}
          initialData={{
            title: `Patent Analysis: ${parsedResult.document_info.patent_number || parsedResult.document_info.title || 'Untitled'}`,
            subtitle: parsedResult.document_info.title || undefined,
            type: 'patent',
            agent: 'patent',
            sourceData: {
              fileName: selectedFile?.name,
              fileSize: selectedFile?.size,
            },
            analysisData: parsedResult,
            qualityData: qualityAssessment,
            ftoRiskData: ftoRiskData,
          }}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setIsAuthenticated(true);
          setShowLoginModal(false);
          // If file is selected, automatically proceed with upload
          if (selectedFile) {
            handleUploadAndParse();
          }
        }}
      />

      {/* Full Analysis Panel */}
      {showFullAnalysisPanel && parsedResult && (
        <PatentFullAnalysisPanel
          patentData={parsedResult}
          qualityData={qualityAssessment || undefined}
          ftoRiskData={ftoRiskData || undefined}
          onClose={() => setShowFullAnalysisPanel(false)}
        />
      )}
    </div>
  );
}
