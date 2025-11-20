/**
 * Investment Workflow Tools Page
 *
 * Showcase of professional deliverable generators and workflow automation tools
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Section from '@/components/shared/Section';
import { generateSEO } from '@/components/layout/SEO';
import { FileText, TrendingUp, BarChart3, Target, Briefcase, CheckSquare } from 'lucide-react';

export const metadata: Metadata = generateSEO({
  title: 'Investment Workflow Tools',
  description: 'Professional deliverable generators and workflow automation tools for institutional-grade biotech investment analysis',
  keywords: ['investment memo', 'due diligence', 'workflow automation', 'financial modeling', 'deliverable generation'],
});

export default function InvestmentToolsPage() {
  const tools = [
    {
      id: 'investment-memo',
      title: 'Investment Memo Generator',
      description: 'Generate comprehensive 15-25 page institutional-grade investment memos with executive summary, market analysis, financial modeling, risk assessment, and IC-ready recommendations.',
      icon: FileText,
      color: 'blue',
      status: 'available',
      features: [
        '16 professional sections (Executive Summary, Company Overview, Market Analysis, etc.)',
        'Institutional quality suitable for IC presentation',
        'Data-driven with metrics, financials, and market data',
        'Professional PDF export with proper formatting',
        'Valuation analysis with multiple methodologies',
        'Risk matrix and mitigation strategies'
      ],
      usageInstructions: [
        'Run a full multi-agent analysis on the /ai-projects/multi-agent-demo page',
        'After analysis completes, click "Generate Investment Memo" in the results section',
        'Wait 2-3 minutes while the system extracts and synthesizes all sections',
        'Download the professional PDF ready for IC presentation'
      ],
      demoUrl: '/ai-projects/multi-agent-demo',
      requiredAgents: ['All 5 agents (Clinical, Patent, Financial, Market, Regulatory)'],
      estimatedTime: '2-3 minutes generation time',
      outputFormats: ['PDF', 'Markdown']
    },
    {
      id: 'financial-models',
      title: 'Financial Modeling Suite',
      description: 'Automated DCF models, risk-adjusted NPV, scenario analysis, and comparable company valuations with Excel export.',
      icon: TrendingUp,
      color: 'green',
      status: 'coming-soon',
      features: [
        'DCF analysis with WACC and terminal value',
        'Risk-adjusted NPV for pipeline assets',
        'Bull/base/bear scenario modeling',
        'Sensitivity tornado charts',
        'Excel export with formulas intact',
        'Comparable company analysis'
      ],
      estimatedTime: 'Coming Q1 2026'
    },
    {
      id: 'competitive-benchmarking',
      title: 'Competitive Benchmarking Engine',
      description: 'Auto-identify comparable companies and generate side-by-side competitive analysis with percentile rankings.',
      icon: BarChart3,
      color: 'purple',
      status: 'coming-soon',
      features: [
        'Automatic peer identification (10-15 companies)',
        'Multi-company comparison tables',
        'Percentile rankings across key metrics',
        'Competitive positioning matrices',
        'Historical precedent analysis',
        'Market share and growth comparisons'
      ],
      estimatedTime: 'Coming Q1 2026'
    },
    {
      id: 'risk-scoring',
      title: 'Risk Scoring System',
      description: 'Automated risk assessment across clinical, commercial, financial, IP, and regulatory dimensions with actionable insights.',
      icon: Target,
      color: 'red',
      status: 'coming-soon',
      features: [
        'Multi-dimensional risk scoring (0-100 scale)',
        'Automatic red flag detection',
        'Risk matrix visualization (likelihood × impact)',
        'Mitigation strategy recommendations',
        'Historical validation against outcomes',
        'Traffic light system (red/yellow/green)'
      ],
      estimatedTime: 'Coming Q2 2026'
    },
    {
      id: 'deal-pipeline',
      title: 'Deal Pipeline Dashboard',
      description: 'Manage multiple investment opportunities with Kanban boards, stage gates, and portfolio analytics.',
      icon: Briefcase,
      color: 'indigo',
      status: 'coming-soon',
      features: [
        'Kanban board (Screening → DD → IC → Closed)',
        'Deal cards with key metrics and status',
        'Portfolio-level analytics and reporting',
        'Resource allocation tracking',
        'Stage gates and milestone tracking',
        'Team collaboration features'
      ],
      estimatedTime: 'Coming Q2 2026'
    },
    {
      id: 'due-diligence-checklist',
      title: 'Due Diligence Checklist Tracker',
      description: 'Comprehensive checklists for biotech DD with progress tracking, document collection, and completion status.',
      icon: CheckSquare,
      color: 'teal',
      status: 'coming-soon',
      features: [
        'Pre-built DD checklists by deal type',
        'Item-by-item completion tracking',
        'Document attachment and organization',
        'Assignee and deadline management',
        'Red flag highlighting',
        'Export to PDF/Excel for reporting'
      ],
      estimatedTime: 'Coming Q2 2026'
    }
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-600' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'text-indigo-600' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', icon: 'text-teal-600' }
  };

  return (
    <>
      {/* Hero Section */}
      <Section className="bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <Briefcase className="w-4 h-4" />
            Professional Deliverables
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Investment Workflow Tools
          </h1>
          <p className="text-xl text-gray-700 mb-4">
            Institutional-grade deliverable generators that transform AI analysis into professional investment documents
          </p>
          <p className="text-lg text-gray-600">
            Automated workflows that save 10-20 hours per deal while maintaining McKinsey/Goldman Sachs quality standards
          </p>
        </div>
      </Section>

      {/* Tools Grid */}
      <Section background="white">
        <div className="max-w-7xl mx-auto">
          {/* Available Tools */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Available Now</h2>
            <p className="text-gray-600 text-center mb-8">Start using these tools today</p>

            <div className="grid grid-cols-1 gap-8">
              {tools.filter(tool => tool.status === 'available').map((tool) => {
                const colors = colorMap[tool.color];
                const IconComponent = tool.icon;

                return (
                  <div
                    key={tool.id}
                    className={`card border-2 ${colors.border} ${colors.bg} transition-all hover:shadow-xl`}
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Icon */}
                      <div className={`flex items-center justify-center w-20 h-20 rounded-xl ${colors.icon} bg-white border-2 ${colors.border} flex-shrink-0`}>
                        <IconComponent className="w-10 h-10" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-2xl font-bold text-gray-900">{tool.title}</h3>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700`}>
                            ✓ Available
                          </span>
                        </div>

                        <p className="text-gray-700 mb-4 text-lg">{tool.description}</p>

                        {/* Features */}
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Key Features:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {tool.features.map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <CheckSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.icon}`} />
                                <span className="text-sm text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Usage Instructions */}
                        {tool.usageInstructions && (
                          <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">How to Use:</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                              {tool.usageInstructions.map((instruction, idx) => (
                                <li key={idx}>{instruction}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                          {tool.estimatedTime && (
                            <div className="flex items-center gap-1">
                              <span className="font-semibold">⏱️ Time:</span> {tool.estimatedTime}
                            </div>
                          )}
                          {tool.outputFormats && (
                            <div className="flex items-center gap-1">
                              <span className="font-semibold">📄 Formats:</span> {tool.outputFormats.join(', ')}
                            </div>
                          )}
                        </div>

                        {/* CTA */}
                        {tool.demoUrl && (
                          <Link
                            href={tool.demoUrl}
                            className={`inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors`}
                          >
                            Try It Now
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coming Soon Tools */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Coming Soon</h2>
            <p className="text-gray-600 text-center mb-8">Tools in development</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.filter(tool => tool.status === 'coming-soon').map((tool) => {
                const colors = colorMap[tool.color];
                const IconComponent = tool.icon;

                return (
                  <div
                    key={tool.id}
                    className={`card border-2 ${colors.border} opacity-75 hover:opacity-100 transition-all`}
                  >
                    {/* Icon */}
                    <div className={`flex items-center justify-center w-16 h-16 rounded-xl ${colors.icon} ${colors.bg} mx-auto mb-4`}>
                      <IconComponent className="w-8 h-8" />
                    </div>

                    {/* Title & Status */}
                    <div className="text-center mb-3">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{tool.title}</h3>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        🚧 Coming Soon
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 mb-4 text-sm text-center">{tool.description}</p>

                    {/* Features */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">Planned Features:</h4>
                      <ul className="space-y-1">
                        {tool.features.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                            <span className={colors.icon}>•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Timeline */}
                    {tool.estimatedTime && (
                      <div className={`text-xs ${colors.text} font-semibold text-center`}>
                        {tool.estimatedTime}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center p-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Investment Workflow?
            </h3>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Start with the multi-agent analysis system and generate your first institutional-grade investment memo in minutes, not days.
            </p>
            <Link
              href="/ai-projects/multi-agent-demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl text-lg"
            >
              Start Analysis
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
