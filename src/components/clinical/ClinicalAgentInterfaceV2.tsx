import React, { useState } from 'react';
import { Map, Shield, Microscope, Users, FileSearch, Target, Pill, Activity, Send } from 'lucide-react';
import {
  AgentInterfaceLayout,
  HeroSkillCard,
  DocumentUploadZone,
  FutureAnalysisDropdown,
} from '../agents/shared';
import type { AgentType } from '../../lib/multiAgentTypes';

// Theme color for Clinical Agent
const THEME_COLOR = 'blue' as const;

interface ClinicalAgentInterfaceV2Props {
  targetName?: string;
  onClose?: () => void;
  currentAgent?: AgentType | 'sonny';
  onAgentSelect?: (agent: AgentType | 'sonny') => void;
}

export const ClinicalAgentInterfaceV2: React.FC<ClinicalAgentInterfaceV2Props> = ({
  targetName = '',
  onClose,
  currentAgent = 'clinical',
  onAgentSelect,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Hero Skill Handlers
  const handleTrialLandscape = async () => {
    setIsAnalyzing('trial-landscape');
    try {
      // Trigger trial landscape analysis
      const response = await fetch('/api/agents/clinical-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Analyze the clinical trial landscape for ${targetName || 'this target'}. Include competitive positioning, trial design insights, and key findings.`,
          }],
          target: targetName,
          analysisType: 'trial_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults({
          type: 'trial-landscape',
          data: data.response || data.message,
        });
      }
    } catch (error) {
      console.error('Trial landscape analysis error:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleValidationScore = async () => {
    setIsAnalyzing('validation-score');
    try {
      // Trigger clinical validation score
      const response = await fetch('/api/agents/clinical-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate a clinical validation score for ${targetName || 'this target'}. Include detailed breakdown of efficacy signals, safety profile, and development risk with confidence intervals.`,
          }],
          target: targetName,
          analysisType: 'target_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults({
          type: 'validation-score',
          data: data.response || data.message,
        });
      }
    } catch (error) {
      console.error('Validation score error:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleExport = (format: string) => {
    console.log('Exporting clinical analysis as:', format);
    // Export logic - can be implemented later
  };

  const handleDocumentsUploaded = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    console.log('Clinical documents uploaded:', files);
  };

  const handleChatSend = async () => {
    if (!chatMessage.trim()) return;

    const message = chatMessage;
    setChatMessage('');

    try {
      const response = await fetch('/api/agents/clinical-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: message,
          }],
          target: targetName,
          analysisType: 'target_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Handle response - could display in chat or update results
        console.log('Clinical agent response:', data);
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  // Future analysis options (collapsed by default)
  const futureAnalysisOptions = [
    {
      id: 'competitive-trials',
      label: 'Competitive Trial Intelligence',
      description: 'Analyze competitor trial designs and timelines',
      icon: Users,
      onClick: () => console.log('Competitive trials'),
    },
    {
      id: 'endpoint-analysis',
      label: 'Endpoint Analysis',
      description: 'Evaluate primary and secondary endpoint selection',
      icon: Target,
      onClick: () => console.log('Endpoint analysis'),
    },
    {
      id: 'patient-population',
      label: 'Patient Population Modeling',
      description: 'Model eligible patient populations and enrollment',
      icon: Users,
      comingSoon: true,
    },
    {
      id: 'safety-signals',
      label: 'Safety Signal Detection',
      description: 'Identify potential safety concerns from trial data',
      icon: Shield,
      comingSoon: true,
    },
    {
      id: 'trial-design',
      label: 'Trial Design Optimizer',
      description: 'AI-powered trial design recommendations',
      icon: Microscope,
      comingSoon: true,
    },
    {
      id: 'regulatory-strategy',
      label: 'Regulatory Strategy Alignment',
      description: 'Align clinical strategy with regulatory pathway',
      icon: FileSearch,
      comingSoon: true,
    },
  ];

  // Chat input component
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
        placeholder="Ask about clinical trials..."
        className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
      />
      <button
        onClick={handleChatSend}
        className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <AgentInterfaceLayout
      agentName="Clinical Development Agent"
      agentIcon={Pill}
      themeColor={THEME_COLOR}
      targetName={targetName}
      onClose={onClose}
      onExport={handleExport}
      chatSection={chatSection}
      currentAgent={currentAgent}
      onAgentSelect={onAgentSelect}
      showAgentSelector={!!onAgentSelect}
      showBackButton={currentAgent !== 'sonny' && !!onAgentSelect}
      onBack={() => onAgentSelect?.('sonny')}
      backButtonLabel="Back to Sonny"
    >
      {/* Hero Skills Section */}
      <section>
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Core Analysis
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <HeroSkillCard
            title="Trial Landscape Analyzer"
            description="Instantly map all clinical trials for your target indication with competitive positioning and trial design insights"
            icon={Map}
            themeColor={THEME_COLOR}
            onClick={handleTrialLandscape}
            isLoading={isAnalyzing === 'trial-landscape'}
            badge="AI-Powered"
          />
          <HeroSkillCard
            title="Clinical Validation Score"
            description="Get an AI-generated clinical validation score with detailed breakdown of efficacy signals, safety profile, and development risk"
            icon={Shield}
            themeColor={THEME_COLOR}
            onClick={handleValidationScore}
            isLoading={isAnalyzing === 'validation-score'}
            badge="Real-time"
          />
        </div>
      </section>

      {/* Analysis Results (shown after analysis) */}
      {analysisResults && (
        <section>
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Analysis Results
          </h3>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-300">
                {typeof analysisResults.data === 'string' 
                  ? analysisResults.data 
                  : JSON.stringify(analysisResults.data, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* Document Upload */}
      <section>
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Upload Clinical Documents
        </h3>
        <DocumentUploadZone
          themeColor={THEME_COLOR}
          onFilesUploaded={handleDocumentsUploaded}
          acceptedTypes={['.pdf', '.docx', '.xlsx', '.csv']}
        />
        <p className="text-xs text-gray-500 mt-2">
          Upload trial protocols, CSRs, or clinical data for AI analysis
        </p>
      </section>

      {/* Future Analysis Options */}
      <section>
        <FutureAnalysisDropdown
          themeColor={THEME_COLOR}
          options={futureAnalysisOptions}
          label="Additional Clinical Analysis"
        />
      </section>
    </AgentInterfaceLayout>
  );
};

export default ClinicalAgentInterfaceV2;

