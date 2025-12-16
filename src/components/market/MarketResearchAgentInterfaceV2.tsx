import React, { useState } from 'react';
import { PieChart, Grid3X3, TrendingUp, Users, Globe, Zap, Building2, LineChart, FileSearch, Target, Send } from 'lucide-react';
import {
  AgentInterfaceLayout,
  HeroSkillCard,
  DocumentUploadZone,
  FutureAnalysisDropdown,
} from '../agents/shared';
import type { AgentType } from '../../lib/multiAgentTypes';

// Theme color for Market Research Agent
const THEME_COLOR = 'cyan' as const;

interface MarketResearchAgentInterfaceV2Props {
  targetName?: string;
  onClose?: () => void;
  currentAgent?: AgentType | 'sonny';
  onAgentSelect?: (agent: AgentType | 'sonny') => void;
}

export const MarketResearchAgentInterfaceV2: React.FC<MarketResearchAgentInterfaceV2Props> = ({
  targetName = '',
  onClose,
  currentAgent = 'market_research',
  onAgentSelect,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleMarketSizing = async () => {
    setIsAnalyzing('market-sizing');
    try {
      const response = await fetch('/api/agents/market-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Perform comprehensive TAM/SAM/SOM analysis for ${targetName || 'this target'}. Include growth projections, segment breakdowns, and addressable patient populations.`,
          }],
          target: targetName,
          analysisType: 'market_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults({
          type: 'market-sizing',
          data: data.response || data.message,
        });
      }
    } catch (error) {
      console.error('Market sizing error:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleCompetitiveMatrix = async () => {
    setIsAnalyzing('competitive-matrix');
    try {
      const response = await fetch('/api/agents/market-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate a competitive positioning matrix for ${targetName || 'this target'}. Show visual competitive landscape with product positioning, differentiation factors, and strategic gap analysis.`,
          }],
          target: targetName,
          analysisType: 'competitive_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults({
          type: 'competitive-matrix',
          data: data.response || data.message,
        });
      }
    } catch (error) {
      console.error('Competitive matrix error:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleExport = (format: string) => {
    console.log('Exporting market research as:', format);
  };

  const handleDocumentsUploaded = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleChatSend = async () => {
    if (!chatMessage.trim()) return;
    const message = chatMessage;
    setChatMessage('');

    try {
      const response = await fetch('/api/agents/market-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }],
          target: targetName,
          analysisType: 'market_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Market research agent response:', data);
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  const futureAnalysisOptions = [
    {
      id: 'kol-mapping',
      label: 'KOL Mapping & Influence',
      description: 'Identify and analyze key opinion leaders in the space',
      icon: Users,
      onClick: () => console.log('KOL mapping'),
    },
    {
      id: 'pipeline-tracker',
      label: 'Pipeline Tracker',
      description: 'Track all assets in development for the indication',
      icon: LineChart,
      onClick: () => console.log('Pipeline tracker'),
    },
    {
      id: 'geographic-analysis',
      label: 'Geographic Market Analysis',
      description: 'Regional market sizing and access considerations',
      icon: Globe,
      onClick: () => console.log('Geographic'),
    },
    {
      id: 'unmet-needs',
      label: 'Unmet Needs Assessment',
      description: 'Identify gaps in current treatment landscape',
      icon: Target,
      comingSoon: true,
    },
    {
      id: 'launch-analogs',
      label: 'Launch Analog Analysis',
      description: 'Analyze comparable product launches',
      icon: Zap,
      comingSoon: true,
    },
    {
      id: 'conference-intel',
      label: 'Conference Intelligence',
      description: 'Track presentations and announcements',
      icon: FileSearch,
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
        placeholder="Ask about market size, competition, or trends..."
        className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
      />
      <button
        onClick={handleChatSend}
        className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <AgentInterfaceLayout
      agentName="Market Intelligence Agent"
      agentIcon={TrendingUp}
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
            title="Market Sizing Analysis"
            description="Comprehensive TAM/SAM/SOM analysis with growth projections, segment breakdowns, and addressable patient populations"
            icon={PieChart}
            themeColor={THEME_COLOR}
            onClick={handleMarketSizing}
            isLoading={isAnalyzing === 'market-sizing'}
            badge="AI-Powered"
          />
          <HeroSkillCard
            title="Competitive Positioning Matrix"
            description="Visual competitive landscape with product positioning, differentiation factors, and strategic gap analysis"
            icon={Grid3X3}
            themeColor={THEME_COLOR}
            onClick={handleCompetitiveMatrix}
            isLoading={isAnalyzing === 'competitive-matrix'}
            badge="Interactive"
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
          Upload Market Research
        </h3>
        <DocumentUploadZone
          themeColor={THEME_COLOR}
          onFilesUploaded={handleDocumentsUploaded}
          acceptedTypes={['.pdf', '.pptx', '.xlsx', '.docx']}
        />
        <p className="text-xs text-gray-500 mt-2">
          Upload market reports, competitive analyses, or research presentations
        </p>
      </section>

      <section>
        <FutureAnalysisDropdown
          themeColor={THEME_COLOR}
          options={futureAnalysisOptions}
          label="Additional Market Analysis"
        />
      </section>
    </AgentInterfaceLayout>
  );
};

export default MarketResearchAgentInterfaceV2;

