import React, { useState } from 'react';
import { Route, Zap, FileCheck, Shield, Clock, Globe, AlertTriangle, BookOpen, Scale, Building2, Send } from 'lucide-react';
import {
  AgentInterfaceLayout,
  HeroSkillCard,
  DocumentUploadZone,
  FutureAnalysisDropdown,
} from '../agents/shared';
import type { AgentType } from '../../lib/multiAgentTypes';

// Theme color for Regulatory Agent
const THEME_COLOR = 'orange' as const;

interface RegulatoryAgentInterfaceV2Props {
  targetName?: string;
  onClose?: () => void;
  currentAgent?: AgentType | 'sonny';
  onAgentSelect?: (agent: AgentType | 'sonny') => void;
}

export const RegulatoryAgentInterfaceV2: React.FC<RegulatoryAgentInterfaceV2Props> = ({
  targetName = '',
  onClose,
  currentAgent = 'regulatory',
  onAgentSelect,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handlePathwayAnalysis = async () => {
    setIsAnalyzing('pathway');
    try {
      const response = await fetch('/api/agents/regulatory-expert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Provide regulatory pathway framing for ${targetName || 'this target'}. Include likely pathways, timeline estimates, required studies, and global filing strategy (no prescriptive directive).`,
          }],
          target: targetName,
          analysisType: 'pathway_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults({
          type: 'pathway',
          data: data.response || data.message,
        });
      }
    } catch (error) {
      console.error('Pathway analysis error:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleDesignationEligibility = async () => {
    setIsAnalyzing('designation');
    try {
      const response = await fetch('/api/agents/regulatory-expert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Assess eligibility for Fast Track, Breakthrough, Priority Review, Accelerated Approval, and RMAT designations for ${targetName || 'this target'}.`,
          }],
          target: targetName,
          analysisType: 'designation_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults({
          type: 'designation',
          data: data.response || data.message,
        });
      }
    } catch (error) {
      console.error('Designation eligibility error:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleExport = (format: string) => {
    console.log('Exporting regulatory analysis as:', format);
  };

  const handleDocumentsUploaded = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleChatSend = async () => {
    if (!chatMessage.trim()) return;
    const message = chatMessage;
    setChatMessage('');

    try {
      const response = await fetch('/api/agents/regulatory-expert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }],
          target: targetName,
          analysisType: 'regulatory_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Regulatory agent response:', data);
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  const futureAnalysisOptions = [
    {
      id: 'fda-precedent',
      label: 'FDA Precedent Analysis',
      description: 'Review FDA decisions for similar products',
      icon: BookOpen,
      onClick: () => console.log('FDA precedent'),
    },
    {
      id: 'timeline-modeling',
      label: 'Regulatory Timeline Modeling',
      description: 'Model approval timelines with scenario analysis',
      icon: Clock,
      onClick: () => console.log('Timeline'),
    },
    {
      id: 'global-strategy',
      label: 'Global Filing Strategy',
      description: 'EMA, PMDA, NMPA, and Health Canada strategy',
      icon: Globe,
      onClick: () => console.log('Global'),
    },
    {
      id: 'risk-assessment',
      label: 'Regulatory Risk Assessment',
      description: 'Identify and mitigate regulatory risks',
      icon: AlertTriangle,
      comingSoon: true,
    },
    {
      id: 'label-negotiation',
      label: 'Label Strategy Advisor',
      description: 'Optimize label claims and indications',
      icon: FileCheck,
      comingSoon: true,
    },
    {
      id: 'advisory-committee',
      label: 'Advisory Committee Prep',
      description: 'Prepare for FDA advisory committee meetings',
      icon: Building2,
      comingSoon: true,
    },
  ];

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
        placeholder="Ask about regulatory pathways, designations, or FDA guidance..."
        className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
      />
      <button
        onClick={handleChatSend}
        className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <AgentInterfaceLayout
      agentName="Regulatory Intelligence Agent"
      agentIcon={Shield}
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
      <section>
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Core Analysis
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <HeroSkillCard
            title="Approval Pathway Advisor"
            description="Regulatory pathway framing with timeline estimates, required studies, and global filing strategy"
            icon={Route}
            themeColor={THEME_COLOR}
            onClick={handlePathwayAnalysis}
            isLoading={isAnalyzing === 'pathway'}
            badge="AI-Powered"
          />
          <HeroSkillCard
            title="Expedited Designation Eligibility"
            description="Assess eligibility for Fast Track, Breakthrough, Priority Review, Accelerated Approval, and RMAT designations"
            icon={Zap}
            themeColor={THEME_COLOR}
            onClick={handleDesignationEligibility}
            isLoading={isAnalyzing === 'designation'}
            badge="Assessment"
          />
        </div>
      </section>

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

      <section>
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Upload Regulatory Documents
        </h3>
        <DocumentUploadZone
          themeColor={THEME_COLOR}
          onFilesUploaded={handleDocumentsUploaded}
          acceptedTypes={['.pdf', '.docx', '.xml']}
        />
        <p className="text-xs text-gray-500 mt-2">
          Upload briefing documents, FDA meeting minutes, or regulatory submissions
        </p>
      </section>

      <section>
        <FutureAnalysisDropdown
          themeColor={THEME_COLOR}
          options={futureAnalysisOptions}
          label="Additional Regulatory Analysis"
        />
      </section>
    </AgentInterfaceLayout>
  );
};

export default RegulatoryAgentInterfaceV2;

