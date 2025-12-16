import React, { useState } from 'react';
import { TrendingUp, LineChart, DollarSign, Calculator, BarChart3, PieChart, Building2, Briefcase, Target, FileSpreadsheet, Send } from 'lucide-react';
import {
  AgentInterfaceLayout,
  HeroSkillCard,
  DocumentUploadZone,
  FutureAnalysisDropdown,
} from '../agents/shared';
import type { AgentType } from '../../lib/multiAgentTypes';

// Theme color for Financial Agent
const THEME_COLOR = 'green' as const;

interface FinancialAgentInterfaceV2Props {
  targetName?: string;
  onClose?: () => void;
  currentAgent?: AgentType | 'sonny';
  onAgentSelect?: (agent: AgentType | 'sonny') => void;
}

export const FinancialAgentInterfaceV2: React.FC<FinancialAgentInterfaceV2Props> = ({
  targetName = '',
  onClose,
  currentAgent = 'financial',
  onAgentSelect,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleDealComps = async () => {
    setIsAnalyzing('deal-comps');
    try {
      const response = await fetch('/api/agents/financial-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Analyze comparable M&A transactions, licensing deals, and valuations for ${targetName || 'this target'}. Include AI-powered benchmarking and deal structures.`,
          }],
          target: targetName,
          analysisType: 'deal_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults({
          type: 'deal-comps',
          data: data.response || data.message,
        });
      }
    } catch (error) {
      console.error('Deal comparables error:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleRevenueModel = async () => {
    setIsAnalyzing('revenue-model');
    try {
      const response = await fetch('/api/agents/financial-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate probability-weighted revenue projections for ${targetName || 'this target'}. Include market sizing, pricing analysis, and scenario modeling.`,
          }],
          target: targetName,
          analysisType: 'valuation_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults({
          type: 'revenue-model',
          data: data.response || data.message,
        });
      }
    } catch (error) {
      console.error('Revenue model error:', error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleExport = (format: string) => {
    console.log('Exporting financial analysis as:', format);
  };

  const handleDocumentsUploaded = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleChatSend = async () => {
    if (!chatMessage.trim()) return;
    const message = chatMessage;
    setChatMessage('');

    try {
      const response = await fetch('/api/agents/financial-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }],
          target: targetName,
          analysisType: 'financial_analysis',
          documents: uploadedFiles.map(f => ({ fileName: f.name, name: f.name })),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Financial agent response:', data);
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  const futureAnalysisOptions = [
    {
      id: 'dcf-model',
      label: 'DCF Valuation Model',
      description: 'Discounted cash flow analysis with risk-adjusted NPV',
      icon: Calculator,
      onClick: () => console.log('DCF model'),
    },
    {
      id: 'market-sizing',
      label: 'Market Sizing Analysis',
      description: 'Bottom-up and top-down market size calculations',
      icon: PieChart,
      onClick: () => console.log('Market sizing'),
    },
    {
      id: 'pricing-analysis',
      label: 'Pricing & Reimbursement',
      description: 'Pricing strategy and reimbursement landscape',
      icon: DollarSign,
      onClick: () => console.log('Pricing'),
    },
    {
      id: 'investor-analysis',
      label: 'Investor Analysis',
      description: 'Analyze investor holdings and funding history',
      icon: Building2,
      comingSoon: true,
    },
    {
      id: 'ma-scenarios',
      label: 'M&A Scenario Modeling',
      description: 'Model acquisition scenarios and synergies',
      icon: Briefcase,
      comingSoon: true,
    },
    {
      id: 'risk-metrics',
      label: 'Financial Risk Metrics',
      description: 'Comprehensive financial risk assessment',
      icon: Target,
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
        placeholder="Ask about valuations, deals, or financials..."
        className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
      />
      <button
        onClick={handleChatSend}
        className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <AgentInterfaceLayout
      agentName="Financial Intelligence Agent"
      agentIcon={DollarSign}
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
            title="Deal Comparables Analysis"
            description="Instant analysis of comparable M&A transactions, licensing deals, and valuations with AI-powered benchmarking"
            icon={TrendingUp}
            themeColor={THEME_COLOR}
            onClick={handleDealComps}
            isLoading={isAnalyzing === 'deal-comps'}
            badge="AI-Powered"
          />
          <HeroSkillCard
            title="Revenue Forecast Model"
            description="Generate probability-weighted revenue projections with market sizing, pricing analysis, and scenario modeling"
            icon={LineChart}
            themeColor={THEME_COLOR}
            onClick={handleRevenueModel}
            isLoading={isAnalyzing === 'revenue-model'}
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
          Upload Financial Documents
        </h3>
        <DocumentUploadZone
          themeColor={THEME_COLOR}
          onFilesUploaded={handleDocumentsUploaded}
          acceptedTypes={['.pdf', '.xlsx', '.csv', '.docx']}
        />
        <p className="text-xs text-gray-500 mt-2">
          Upload financial models, deal sheets, or market reports for AI analysis
        </p>
      </section>

      <section>
        <FutureAnalysisDropdown
          themeColor={THEME_COLOR}
          options={futureAnalysisOptions}
          label="Additional Financial Analysis"
        />
      </section>
    </AgentInterfaceLayout>
  );
};

export default FinancialAgentInterfaceV2;

