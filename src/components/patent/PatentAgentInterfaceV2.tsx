import React, { useState } from 'react';
import { AlertTriangle, Map, FileText, Search, Scale, Lightbulb, GitBranch, Building2, Dna, Send } from 'lucide-react';
import {
  AgentInterfaceLayout,
  HeroSkillCard,
  DocumentUploadZone,
  FutureAnalysisDropdown,
} from '../agents/shared';
import type { AgentType } from '../../lib/multiAgentTypes';

// Theme color for Patent Agent
const THEME_COLOR = 'purple' as const;

interface PatentAgentInterfaceV2Props {
  targetName?: string;
  onClose?: () => void;
  currentAgent?: AgentType | 'sonny';
  onAgentSelect?: (agent: AgentType | 'sonny') => void;
}

export const PatentAgentInterfaceV2: React.FC<PatentAgentInterfaceV2Props> = ({
  targetName = '',
  onClose,
  currentAgent = 'patent',
  onAgentSelect,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Hero Skill Handlers
  const handleFTOAnalysis = async () => {
    setIsAnalyzing('fto');
    try {
      // Trigger FTO risk assessment
      const response = await fetch('/api/agents/patent-expert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Perform a comprehensive Freedom-to-Operate analysis for ${targetName || 'this target'}. Include risk assessment, blocking patents identification, and decision-support considerations (no prescriptive directive).`,
          }],
          target: targetName,
          analysisType: 'fto_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults({
          type: 'fto',
          data: data.response || data.message,
        });
      }
    } catch (error) {
      console.error('FTO analysis error:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handlePatentLandscape = async () => {
    setIsAnalyzing('landscape');
    try {
      // Trigger patent landscape mapping
      const response = await fetch('/api/agents/patent-expert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate a visual patent landscape for ${targetName || 'this target'}. Show key players, white spaces, and strategic filing opportunities with interactive clustering.`,
          }],
          target: targetName,
          analysisType: 'landscape_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults({
          type: 'landscape',
          data: data.response || data.message,
        });
      }
    } catch (error) {
      console.error('Patent landscape error:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleExport = (format: string) => {
    console.log('Exporting patent analysis as:', format);
    // Export logic - can be implemented later
  };

  const handleDocumentsUploaded = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    console.log('Patent documents uploaded:', files);
  };

  const handleChatSend = async () => {
    if (!chatMessage.trim()) return;

    const message = chatMessage;
    setChatMessage('');

    try {
      const response = await fetch('/api/agents/patent-expert', {
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
          analysisType: 'patent_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Patent agent response:', data);
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  // Future analysis options (collapsed by default)
  const futureAnalysisOptions = [
    {
      id: 'claims-extraction',
      label: 'Claims Extraction & Analysis',
      description: 'Extract and analyze patent claims with AI interpretation',
      icon: FileText,
      onClick: () => console.log('Claims extraction'),
    },
    {
      id: 'sequence-analysis',
      label: 'Sequence Patent Search',
      description: 'Search patents by biological sequence similarity',
      icon: Dna,
      onClick: () => console.log('Sequence analysis'),
    },
    {
      id: 'prior-art',
      label: 'Prior Art Search',
      description: 'Comprehensive prior art discovery and analysis',
      icon: Search,
      onClick: () => console.log('Prior art'),
    },
    {
      id: 'invalidity',
      label: 'Invalidity Contention Analysis',
      description: 'Identify potential grounds for patent invalidity',
      icon: Scale,
      comingSoon: true,
    },
    {
      id: 'licensing',
      label: 'Licensing Opportunity Finder',
      description: 'Identify licensing opportunities and potential partners',
      icon: Building2,
      comingSoon: true,
    },
    {
      id: 'whitespace',
      label: 'White Space Analysis',
      description: 'Identify unprotected innovation opportunities',
      icon: Lightbulb,
      comingSoon: true,
    },
    {
      id: 'family-tree',
      label: 'Patent Family Tree',
      description: 'Visualize patent family relationships globally',
      icon: GitBranch,
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
        placeholder="Ask about patents, FTO, or IP strategy..."
        className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
      />
      <button
        onClick={handleChatSend}
        className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <AgentInterfaceLayout
      agentName="Patent Intelligence Agent"
      agentIcon={Scale}
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
            title="FTO Risk Assessment"
            description="Comprehensive Freedom-to-Operate analysis with risk assessment, blocking patents identification, and decision-support considerations"
            icon={AlertTriangle}
            themeColor={THEME_COLOR}
            onClick={handleFTOAnalysis}
            isLoading={isAnalyzing === 'fto'}
            badge="AI-Powered"
          />
          <HeroSkillCard
            title="Patent Landscape Map"
            description="Visual patent landscape showing key players, white spaces, and strategic filing opportunities with interactive clustering"
            icon={Map}
            themeColor={THEME_COLOR}
            onClick={handlePatentLandscape}
            isLoading={isAnalyzing === 'landscape'}
            badge="Interactive"
          />
        </div>
      </section>

      {/* Analysis Results */}
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
          Upload Patent Documents
        </h3>
        <DocumentUploadZone
          themeColor={THEME_COLOR}
          onFilesUploaded={handleDocumentsUploaded}
          acceptedTypes={['.pdf', '.docx', '.txt', '.xml']}
        />
        <p className="text-xs text-gray-500 mt-2">
          Upload patents, claims, or sequence files for AI analysis
        </p>
      </section>

      {/* Future Analysis Options */}
      <section>
        <FutureAnalysisDropdown
          themeColor={THEME_COLOR}
          options={futureAnalysisOptions}
          label="Additional Patent Analysis"
        />
      </section>
    </AgentInterfaceLayout>
  );
};

export default PatentAgentInterfaceV2;

