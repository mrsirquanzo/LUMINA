import React, { useState } from 'react';
import { Activity, CheckCircle, Dna, Microscope, FlaskConical, Sparkles, Network, BookOpen, Target, Beaker, Send } from 'lucide-react';
import {
  AgentInterfaceLayout,
  HeroSkillCard,
  DocumentUploadZone,
  FutureAnalysisDropdown,
} from '../agents/shared';
import type { AgentType } from '../../lib/multiAgentTypes';

// Theme color for Target Biology Agent
const THEME_COLOR = 'emerald' as const;

interface TargetBiologyAgentInterfaceV2Props {
  targetName?: string;
  onClose?: () => void;
  currentAgent?: AgentType | 'sonny';
  onAgentSelect?: (agent: AgentType | 'sonny') => void;
}

export const TargetBiologyAgentInterfaceV2: React.FC<TargetBiologyAgentInterfaceV2Props> = ({
  targetName = '',
  onClose,
  currentAgent = 'target_biology',
  onAgentSelect,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleExpressionAnalysis = async () => {
    setIsAnalyzing('expression');
    try {
      const response = await fetch('/api/agents/target-biology', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Perform comprehensive gene/protein expression analysis for ${targetName || 'this target'}. Include analysis across tissues, disease states, and cell types with druggability assessment.`,
          }],
          target: targetName,
          analysisType: 'expression_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults({
          type: 'expression',
          data: data.response || data.message,
        });
      }
    } catch (error) {
      console.error('Expression analysis error:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleGeneticValidation = async () => {
    setIsAnalyzing('genetic');
    try {
      const response = await fetch('/api/agents/target-biology', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate an AI-generated target validation score for ${targetName || 'this target'}. Include genetic associations, LOF studies, and human evidence with confidence intervals.`,
          }],
          target: targetName,
          analysisType: 'validation_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults({
          type: 'genetic',
          data: data.response || data.message,
        });
      }
    } catch (error) {
      console.error('Genetic validation error:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleExport = (format: string) => {
    console.log('Exporting biology analysis as:', format);
  };

  const handleDocumentsUploaded = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleChatSend = async () => {
    if (!chatMessage.trim()) return;
    const message = chatMessage;
    setChatMessage('');

    try {
      const response = await fetch('/api/agents/target-biology', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }],
          target: targetName,
          analysisType: 'biology_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Target biology agent response:', data);
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  const futureAnalysisOptions = [
    {
      id: 'pathway-analysis',
      label: 'Pathway & Network Analysis',
      description: 'Analyze signaling pathways and protein interactions',
      icon: Network,
      onClick: () => console.log('Pathway analysis'),
    },
    {
      id: 'structure-analysis',
      label: 'Structural Analysis',
      description: 'Protein structure analysis and binding site prediction',
      icon: Microscope,
      onClick: () => console.log('Structure'),
    },
    {
      id: 'literature-review',
      label: 'Literature Deep Dive',
      description: 'Comprehensive PubMed analysis with key findings',
      icon: BookOpen,
      onClick: () => console.log('Literature'),
    },
    {
      id: 'biomarker-id',
      label: 'Biomarker Identification',
      description: 'Identify potential biomarkers for patient selection',
      icon: Target,
      comingSoon: true,
    },
    {
      id: 'assay-design',
      label: 'Assay Design Recommendations',
      description: 'AI-recommended assays for target validation',
      icon: FlaskConical,
      comingSoon: true,
    },
    {
      id: 'safety-liability',
      label: 'Safety Liability Assessment',
      description: 'Predict on-target and off-target safety concerns',
      icon: Beaker,
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
        placeholder="Ask about target biology, expression, or validation..."
        className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
      />
      <button
        onClick={handleChatSend}
        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <AgentInterfaceLayout
      agentName="Target Biology Agent"
      agentIcon={Dna}
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
            title="Expression Profile Analysis"
            description="Comprehensive gene/protein expression analysis across tissues, disease states, and cell types with druggability assessment"
            icon={Activity}
            themeColor={THEME_COLOR}
            onClick={handleExpressionAnalysis}
            isLoading={isAnalyzing === 'expression'}
            badge="AI-Powered"
          />
          <HeroSkillCard
            title="Genetic Validation Score"
            description="AI-generated target validation score based on genetic associations, LOF studies, and human evidence with confidence intervals"
            icon={CheckCircle}
            themeColor={THEME_COLOR}
            onClick={handleGeneticValidation}
            isLoading={isAnalyzing === 'genetic'}
            badge="Real-time"
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
          Upload Research Documents
        </h3>
        <DocumentUploadZone
          themeColor={THEME_COLOR}
          onFilesUploaded={handleDocumentsUploaded}
          acceptedTypes={['.pdf', '.csv', '.xlsx', '.fasta', '.pdb']}
        />
        <p className="text-xs text-gray-500 mt-2">
          Upload research papers, expression data, sequences, or structure files
        </p>
      </section>

      <section>
        <FutureAnalysisDropdown
          themeColor={THEME_COLOR}
          options={futureAnalysisOptions}
          label="Additional Biology Analysis"
        />
      </section>
    </AgentInterfaceLayout>
  );
};

export default TargetBiologyAgentInterfaceV2;

