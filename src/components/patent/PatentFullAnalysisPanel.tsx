/**
 * Patent Full Analysis Panel
 * Expanded view showing comprehensive patent analysis with tabs
 */

import { useState, useCallback } from 'react';
import { ArrowLeft, X, FileText, Dna, AlertTriangle, Clock, Download, Send, Paperclip, Mic, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PatentExtractionResult } from '../../lib/patentParsing/types';
import type { QualityAssessment } from '../../lib/patentParsing/qualityAssurance';

interface PatentFullAnalysisPanelProps {
  patentData: PatentExtractionResult;
  qualityData?: QualityAssessment;
  ftoRiskData?: {
    level: 'low' | 'moderate' | 'high';
    score: number;
    concerns: Array<{
      type: string;
      severity: 'low' | 'moderate' | 'high';
      message: string;
      patents?: string[];
    }>;
    recommendations: string[];
  };
  onClose: () => void;
  onBack?: () => void;
}

type TabType = 'overview' | 'claims' | 'sequences' | 'fto' | 'timeline' | 'export';

export default function PatentFullAnalysisPanel({
  patentData,
  qualityData,
  ftoRiskData,
  onClose,
  onBack,
}: PatentFullAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'agent'; content: string; timestamp: Date }>>([]);
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Calculate IP Strength
  const calculateIPStrength = (): number => {
    let score = 0;
    
    // Claims (max 25 points)
    const totalClaims = patentData.claims_analysis.total_claims;
    const independentClaims = patentData.claims_analysis.independent_claims;
    score += Math.min(25, (independentClaims / 10) * 25);
    
    // Sequences (max 25 points)
    const totalSequences = 
      patentData.molecular_data.sequences.antibodies.length +
      patentData.molecular_data.sequences.nucleic_acids.length +
      patentData.molecular_data.sequences.small_molecules.length;
    score += Math.min(25, (totalSequences / 20) * 25);
    
    // Quality confidence (max 25 points)
    if (qualityData) {
      score += qualityData.overall_confidence * 25;
    }
    
    return Math.round(Math.min(100, score));
  };

  // Calculate expiry date
  const calculateExpiryDate = (): string => {
    const filingDate = patentData.document_info.priority_date || patentData.document_info.publication_date;
    if (!filingDate) return 'Unknown';
    
    const date = new Date(filingDate);
    // Standard patent term is 20 years from filing
    const expiryYear = date.getFullYear() + 20;
    // Add PTE (Patent Term Extension) estimate - typically 0-5 years
    const pteEstimate = 0; // Would be calculated based on regulatory delays
    
    return `${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} ${expiryYear + pteEstimate} (+PTE est.)`;
  };

  // Handle chat message
  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || isSendingChat) return;

    const userMessage = {
      role: 'user' as const,
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsSendingChat(true);

    try {
      const response = await fetch('/api/patent-parsing/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          context: chatMessages.length > 0 
            ? `Previous conversation:\n${chatMessages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}` 
            : undefined,
          patentData: patentData,
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
        content: data.response,
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
      setIsSendingChat(false);
    }
  }, [chatInput, chatMessages, patentData, isSendingChat]);

  const ipStrength = calculateIPStrength();
  const expiryDate = calculateExpiryDate();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-7xl h-[90vh] bg-surface border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-surfaceElevated">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-surface rounded-lg transition-colors"
                aria-label="Back"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5 text-textSecondary" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-semibold text-textPrimary">
                Patent Analysis: {patentData.document_info.patent_number || 'Unknown Patent'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Toggle fullscreen (if needed in future)
                // For now, just ensure it's visible
              }}
              className="p-2 hover:bg-surface rounded-lg transition-colors"
              aria-label="Expand"
              title="Expand"
            >
              <Maximize2 className="w-5 h-5 text-textSecondary" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface rounded-lg transition-colors"
              aria-label="Close"
              title="Close"
            >
              <X className="w-5 h-5 text-textSecondary" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
            {/* Overview Section */}
            <div className="bg-surfaceElevated border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-textPrimary mb-4">Overview</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-medium text-textPrimary mb-1">
                    {patentData.document_info.title || 'Untitled Patent'}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-textSecondary">
                    {patentData.document_info.assignee && (
                      <span>{patentData.document_info.assignee}</span>
                    )}
                    {patentData.document_info.publication_date && (
                      <>
                        <span>•</span>
                        <span>Filed: {new Date(patentData.document_info.publication_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </>
                    )}
                    {patentData.document_info.publication_date && (
                      <>
                        <span>•</span>
                        <span>Granted: {new Date(patentData.document_info.publication_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {/* IP Strength */}
                  <div className="bg-surface border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-textSecondary">IP Strength</span>
                      <span className="text-sm font-semibold text-textPrimary">{ipStrength}/100</span>
                    </div>
                    <div className="w-full bg-surfaceElevated rounded-full h-2">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
                        style={{ width: `${ipStrength}%` }}
                      />
                    </div>
                  </div>

                  {/* FTO Risk */}
                  <div className="bg-surface border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-textSecondary">FTO Risk</span>
                      <span className={`text-sm font-semibold ${
                        ftoRiskData?.level === 'low' ? 'text-success' :
                        ftoRiskData?.level === 'moderate' ? 'text-warning' : 'text-danger'
                      }`}>
                        {ftoRiskData?.level === 'low' ? '🟢 Low' : 
                         ftoRiskData?.level === 'moderate' ? '🟡 Medium' : '🔴 High'}
                      </span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      ftoRiskData?.level === 'low' ? 'bg-success' :
                      ftoRiskData?.level === 'moderate' ? 'bg-warning' : 'bg-danger'
                    }`} />
                  </div>

                  {/* Expiry */}
                  <div className="bg-surface border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-textSecondary">Expiry</span>
                    </div>
                    <div className="text-sm font-semibold text-textPrimary">
                      {expiryDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10">
              <div className="flex gap-1">
                {[
                  { id: 'overview' as TabType, label: 'Overview', icon: FileText },
                  { id: 'claims' as TabType, label: 'Claims', icon: FileText },
                  { id: 'sequences' as TabType, label: 'Sequences', icon: Dna },
                  { id: 'fto' as TabType, label: 'FTO', icon: AlertTriangle },
                  { id: 'timeline' as TabType, label: 'Timeline', icon: Clock },
                  { id: 'export' as TabType, label: 'Export', icon: Download },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-textSecondary hover:text-textPrimary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === 'claims' && (
                  <motion.div
                    key="claims"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ClaimsTab patentData={patentData} />
                  </motion.div>
                )}
                {activeTab === 'sequences' && (
                  <motion.div
                    key="sequences"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <SequencesTab patentData={patentData} />
                  </motion.div>
                )}
                {activeTab === 'fto' && (
                  <motion.div
                    key="fto"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <FTOTab ftoRiskData={ftoRiskData} patentData={patentData} />
                  </motion.div>
                )}
                {activeTab === 'timeline' && (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <TimelineTab patentData={patentData} />
                  </motion.div>
                )}
                {activeTab === 'export' && (
                  <motion.div
                    key="export"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ExportTab patentData={patentData} qualityData={qualityData} ftoRiskData={ftoRiskData} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="border-t border-white/10 bg-surfaceElevated p-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-sm text-textSecondary mb-2">Ask Patent Expert about this analysis...</div>
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSend();
                    }
                  }}
                  placeholder="Ask a question about this patent..."
                  rows={2}
                  className="w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>
              <button
                onClick={() => {}}
                className="p-3 bg-surface border border-white/10 rounded-lg hover:border-primary/50 transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4 text-textSecondary" />
              </button>
              <button
                onClick={() => {}}
                className="p-3 bg-surface border border-white/10 rounded-lg hover:border-primary/50 transition-colors"
                title="Voice input"
              >
                <Mic className="w-4 h-4 text-textSecondary" />
              </button>
              <button
                onClick={handleChatSend}
                disabled={!chatInput.trim() || isSendingChat}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
            
            {/* Chat Messages */}
            {chatMessages.length > 0 && (
              <div className="mt-4 space-y-3 max-h-48 overflow-y-auto">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-surface border border-white/10 text-textPrimary'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Overview Tab Component - Shows LLM Analysis
function OverviewTab({ 
  patentData, 
  qualityData, 
  ftoRiskData 
}: { 
  patentData: PatentExtractionResult; 
  qualityData?: QualityAssessment;
  ftoRiskData?: PatentFullAnalysisPanelProps['ftoRiskData'];
}) {
  const llmAnalysis = (patentData as any).llmAnalysis;
  
  return (
    <div className="space-y-6">
      {llmAnalysis && llmAnalysis.content ? (
        <div className="bg-surfaceElevated border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Expert Analysis</h3>
          <div 
            className="prose prose-invert max-w-none text-textPrimary"
            dangerouslySetInnerHTML={{ 
              __html: llmAnalysis.content
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/## (.*?)\n/g, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
                .replace(/### (.*?)\n/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                .replace(/^- (.*?)$/gm, '<li>$1</li>')
                .replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside space-y-1 my-2">$1</ul>')
            }}
          />
          {llmAnalysis.usage && (
            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-textSecondary">
              Analysis generated using {llmAnalysis.usage.inputTokens + llmAnalysis.usage.outputTokens} tokens
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surfaceElevated border border-white/10 rounded-lg p-6">
          <p className="text-textSecondary">LLM analysis is being generated or is unavailable. The structured extraction data is available in other tabs.</p>
        </div>
      )}
      
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-white/10 rounded-lg p-4">
          <p className="text-sm text-textSecondary mb-1">Claims</p>
          <p className="text-2xl font-bold text-textPrimary">{patentData.claims_analysis.total_claims}</p>
          <p className="text-xs text-textSecondary">{patentData.claims_analysis.independent_claims} independent</p>
        </div>
        <div className="bg-surface border border-white/10 rounded-lg p-4">
          <p className="text-sm text-textSecondary mb-1">Sequences</p>
          <p className="text-2xl font-bold text-textPrimary">
            {patentData.molecular_data.sequences.antibodies.length +
             patentData.molecular_data.sequences.nucleic_acids.length}
          </p>
          <p className="text-xs text-textSecondary">extracted</p>
        </div>
        <div className="bg-surface border border-white/10 rounded-lg p-4">
          <p className="text-sm text-textSecondary mb-1">Quality</p>
          <p className="text-2xl font-bold text-textPrimary">
            {qualityData ? `${(qualityData.overall_confidence * 100).toFixed(0)}%` : 'N/A'}
          </p>
          <p className="text-xs text-textSecondary">{qualityData?.confidence_level || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

// Claims Tab Component
function ClaimsTab({ patentData }: { patentData: PatentExtractionResult }) {
  const claims = patentData.claims_analysis.claims || [];
  const independentClaims = claims.filter((c: any) => c.is_independent);
  const dependentClaims = claims.filter((c: any) => !c.is_independent);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-textSecondary">
            {patentData.claims_analysis.total_claims} Total Claims • {patentData.claims_analysis.independent_claims} Independent • {dependentClaims.length} Dependent
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {independentClaims.slice(0, 5).map((claim: any, idx: number) => {
          const dependent = dependentClaims.filter((c: any) => 
            c.depends_on?.includes(claim.claim_number)
          );
          
          return (
            <div key={idx} className="bg-surfaceElevated border border-white/10 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-textPrimary">
                      Claim {claim.claim_number || idx + 1} (Independent)
                    </span>
                    <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                      {claim.category || 'COMPOSITION'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-textSecondary mb-3 line-clamp-3">
                    {claim.text || claim.claim_text || 'No claim text available'}
                  </p>
                  
                  <div className="text-xs text-textTertiary mb-3">
                    <span className="font-medium">Scope:</span> {claim.scope || 'NARROW - Requires exact CDR sequences'}
                  </div>

                  {dependent.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      {dependent.slice(0, 3).map((dep: any, depIdx: number) => (
                        <div key={depIdx} className="flex items-start gap-2 text-sm text-textSecondary">
                          <span className="text-primary">├──</span>
                          <div>
                            <span className="font-medium">Claim {dep.claim_number || depIdx + 1}</span>
                            <span className="ml-2">- {dep.category || dep.text?.substring(0, 50) || 'Dependent claim'}</span>
                          </div>
                        </div>
                      ))}
                      {dependent.length > 3 && (
                        <div className="text-xs text-textTertiary ml-6">
                          +{dependent.length - 3} more dependent claims
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Sequences Tab Component
function SequencesTab({ patentData }: { patentData: PatentExtractionResult }) {
  const antibodies = patentData.molecular_data.sequences.antibodies || [];
  const nucleicAcids = patentData.molecular_data.sequences.nucleic_acids || [];
  const smallMolecules = patentData.molecular_data.sequences.small_molecules || [];

  return (
    <div className="space-y-6">
      {/* Antibodies */}
      {antibodies.length > 0 && (
        <div>
          <h4 className="text-base font-semibold text-textPrimary mb-4">
            Antibodies ({antibodies.length})
          </h4>
          <div className="space-y-4">
            {antibodies.slice(0, 5).map((ab: any, idx: number) => (
              <div key={idx} className="bg-surfaceElevated border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Dna className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-textPrimary">
                        {ab.name || `Antibody ${idx + 1}`}
                      </span>
                      {ab.seq_id_no && (
                        <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                          SEQ ID NO: {ab.seq_id_no}
                        </span>
                      )}
                    </div>
                    
                    {ab.hcdr3 && (
                      <div className="mb-2">
                        <span className="text-xs text-textSecondary">HCDR3:</span>
                        <code className="ml-2 text-xs font-mono bg-surface px-2 py-1 rounded text-textPrimary">
                          {ab.hcdr3.sequence || ab.hcdr3}
                        </code>
                      </div>
                    )}
                    
                    {ab.hcdr1 && (
                      <div className="mb-2">
                        <span className="text-xs text-textSecondary">HCDR1:</span>
                        <code className="ml-2 text-xs font-mono bg-surface px-2 py-1 rounded text-textPrimary">
                          {ab.hcdr1.sequence || ab.hcdr1}
                        </code>
                      </div>
                    )}
                    
                    {ab.hcdr2 && (
                      <div>
                        <span className="text-xs text-textSecondary">HCDR2:</span>
                        <code className="ml-2 text-xs font-mono bg-surface px-2 py-1 rounded text-textPrimary">
                          {ab.hcdr2.sequence || ab.hcdr2}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nucleic Acids */}
      {nucleicAcids.length > 0 && (
        <div>
          <h4 className="text-base font-semibold text-textPrimary mb-4">
            Nucleic Acids ({nucleicAcids.length})
          </h4>
          <div className="space-y-4">
            {nucleicAcids.slice(0, 5).map((na: any, idx: number) => (
              <div key={idx} className="bg-surfaceElevated border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Dna className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-textPrimary">
                        {na.name || `Nucleic Acid ${idx + 1}`}
                      </span>
                      {na.seq_id_no && (
                        <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-500 rounded">
                          SEQ ID NO: {na.seq_id_no}
                        </span>
                      )}
                    </div>
                    {na.sequence && (
                      <code className="text-xs font-mono bg-surface px-2 py-1 rounded text-textPrimary block break-all">
                        {na.sequence.substring(0, 200)}
                        {na.sequence.length > 200 ? '...' : ''}
                      </code>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Small Molecules */}
      {smallMolecules.length > 0 && (
        <div>
          <h4 className="text-base font-semibold text-textPrimary mb-4">
            Small Molecules ({smallMolecules.length})
          </h4>
          <div className="space-y-4">
            {smallMolecules.slice(0, 5).map((sm: any, idx: number) => (
              <div key={idx} className="bg-surfaceElevated border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-textPrimary">
                        {sm.name || sm.compound_id || `Compound ${idx + 1}`}
                      </span>
                    </div>
                    {sm.smiles && (
                      <code className="text-xs font-mono bg-surface px-2 py-1 rounded text-textPrimary">
                        {sm.smiles}
                      </code>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {antibodies.length === 0 && nucleicAcids.length === 0 && smallMolecules.length === 0 && (
        <div className="text-center py-12 text-textSecondary">
          <Dna className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No sequences extracted from this patent</p>
        </div>
      )}
    </div>
  );
}

// FTO Tab Component
function FTOTab({ 
  ftoRiskData, 
  patentData 
}: { 
  ftoRiskData?: PatentFullAnalysisPanelProps['ftoRiskData'];
  patentData: PatentExtractionResult;
}) {
  return (
    <div className="space-y-6">
      {/* Risk Summary */}
      <div className="bg-surfaceElevated border border-white/10 rounded-lg p-6">
        <h4 className="text-base font-semibold text-textPrimary mb-4">FTO Risk Assessment</h4>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <span className="text-sm text-textSecondary">Risk Level</span>
            <div className="mt-2">
              <span className={`text-2xl font-bold ${
                ftoRiskData?.level === 'low' ? 'text-success' :
                ftoRiskData?.level === 'moderate' ? 'text-warning' : 'text-danger'
              }`}>
                {ftoRiskData?.level === 'low' ? 'Low' : 
                 ftoRiskData?.level === 'moderate' ? 'Moderate' : 'High'}
              </span>
            </div>
          </div>
          <div>
            <span className="text-sm text-textSecondary">Risk Score</span>
            <div className="mt-2">
              <span className="text-2xl font-bold text-textPrimary">
                {(ftoRiskData?.score || 0.5) * 100}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Concerns */}
      {ftoRiskData && ftoRiskData.concerns.length > 0 && (
        <div>
          <h4 className="text-base font-semibold text-textPrimary mb-4">Identified Concerns</h4>
          <div className="space-y-3">
            {ftoRiskData.concerns.map((concern, idx) => (
              <div
                key={idx}
                className={`bg-surfaceElevated border rounded-lg p-4 ${
                  concern.severity === 'high'
                    ? 'border-danger/50 bg-danger/5'
                    : concern.severity === 'moderate'
                    ? 'border-warning/50 bg-warning/5'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      concern.severity === 'high'
                        ? 'text-danger'
                        : concern.severity === 'moderate'
                        ? 'text-warning'
                        : 'text-textSecondary'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        concern.severity === 'high'
                          ? 'bg-danger/20 text-danger'
                          : concern.severity === 'moderate'
                          ? 'bg-warning/20 text-warning'
                          : 'bg-surface text-textSecondary'
                      }`}>
                        {concern.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-textSecondary">{concern.type.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-textPrimary">{concern.message}</p>
                    {concern.patents && concern.patents.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-textSecondary">Related Patents: </span>
                        {concern.patents.map((pat, patIdx) => (
                          <span key={patIdx} className="text-xs text-primary">
                            {pat}
                            {patIdx < concern.patents!.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {ftoRiskData && ftoRiskData.recommendations.length > 0 && (
        <div>
          <h4 className="text-base font-semibold text-textPrimary mb-4">Recommendations</h4>
          <div className="space-y-2">
            {ftoRiskData.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-surfaceElevated border border-white/10 rounded-lg p-4"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                </div>
                <p className="text-sm text-textPrimary">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!ftoRiskData || ftoRiskData.concerns.length === 0) && (
        <div className="text-center py-12 text-textSecondary">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No FTO concerns identified</p>
        </div>
      )}
    </div>
  );
}

// Timeline Tab Component
function TimelineTab({ patentData }: { patentData: PatentExtractionResult }) {
  const events = [
    {
      date: patentData.document_info.priority_date,
      label: 'Priority Date',
      description: 'First filing date',
    },
    {
      date: patentData.document_info.publication_date,
      label: 'Publication Date',
      description: 'Patent published',
    },
    {
      date: patentData.document_info.publication_date,
      label: 'Grant Date',
      description: 'Patent granted',
    },
  ].filter((e) => e.date);

  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold text-textPrimary mb-4">Patent Timeline</h4>
      
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />
        <div className="space-y-6">
          {events.map((event, idx) => (
            <div key={idx} className="flex items-start gap-4 relative">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 z-10">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-textPrimary">{event.label}</span>
                  <span className="text-xs text-textSecondary">
                    {new Date(event.date!).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <p className="text-sm text-textSecondary">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export Tab Component
function ExportTab({ 
  patentData, 
  qualityData, 
  ftoRiskData 
}: { 
  patentData: PatentExtractionResult;
  qualityData?: QualityAssessment;
  ftoRiskData?: PatentFullAnalysisPanelProps['ftoRiskData'];
}) {
  const handleExport = useCallback(async (format: 'pdf' | 'json' | 'markdown') => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}...`);
  }, []);

  return (
    <div className="space-y-6">
      <h4 className="text-base font-semibold text-textPrimary mb-4">Export Analysis</h4>
      
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => handleExport('pdf')}
          className="p-6 bg-surfaceElevated border border-white/10 rounded-lg hover:border-primary/50 transition-colors text-left"
        >
          <Download className="w-8 h-8 text-primary mb-3" />
          <div className="text-sm font-semibold text-textPrimary mb-1">PDF Report</div>
          <div className="text-xs text-textSecondary">Export as formatted PDF document</div>
        </button>

        <button
          onClick={() => handleExport('json')}
          className="p-6 bg-surfaceElevated border border-white/10 rounded-lg hover:border-primary/50 transition-colors text-left"
        >
          <Download className="w-8 h-8 text-cyan-500 mb-3" />
          <div className="text-sm font-semibold text-textPrimary mb-1">JSON Data</div>
          <div className="text-xs text-textSecondary">Export raw data as JSON</div>
        </button>

        <button
          onClick={() => handleExport('markdown')}
          className="p-6 bg-surfaceElevated border border-white/10 rounded-lg hover:border-primary/50 transition-colors text-left"
        >
          <Download className="w-8 h-8 text-green-500 mb-3" />
          <div className="text-sm font-semibold text-textPrimary mb-1">Markdown</div>
          <div className="text-xs text-textSecondary">Export as Markdown document</div>
        </button>
      </div>
    </div>
  );
}
