"use client";

import { Company, EvidenceItem } from '@/lib/lumina/types';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface EvidenceMatrixProps {
  company: Company;
}

function getStatusIcon(status: 'strong' | 'weak' | 'moderate') {
  switch (status) {
    case 'strong':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'weak':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'moderate':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  }
}

export default function EvidenceMatrix({ company }: EvidenceMatrixProps) {
  const geneticEvidence = company.geneticEvidence || [
    { text: 'Knockout studies show reduced tumor growth', status: 'strong' as const, source: 'PubMed: 12345' },
    { text: 'GWAS association with disease risk', status: 'moderate' as const, source: 'Nature Genetics' },
  ];

  const clinicalPrecedent = company.clinicalPrecedent || [
    { text: 'Similar targets show clinical efficacy', status: 'strong' as const, source: 'FDA' },
    { text: 'Phase 2 data from competitor programs', status: 'moderate' as const, source: 'ClinicalTrials.gov' },
  ];

  const biologicalRationale = company.biologicalRationale || [
    { text: 'Target expression correlates with patient outcomes', status: 'strong' as const, source: 'PubMed: 67890' },
    { text: 'Mechanism of action well-characterized', status: 'strong' as const, source: 'Cell' },
    { text: 'Limited off-target effects in preclinical models', status: 'moderate' as const, source: 'ToxSci' },
  ];

  const renderColumn = (title: string, items: EvidenceItem[]) => (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
      <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
        {title}
      </h4>
      <div className="space-y-4">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={index} className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(item.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 mb-2">{item.text}</p>
                <button
                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-scientist-primary-500/20 text-scientist-primary-300 text-xs font-medium border border-scientist-primary-500/30 hover:bg-scientist-primary-500/30 transition-colors cursor-pointer"
                  onClick={() => {
                    // In a real app, this would open the source link
                    console.log('Source clicked:', item.source);
                  }}
                >
                  {item.source}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">No {title.toLowerCase()} available.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Evidence Matrix</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderColumn('Genetic Evidence', geneticEvidence)}
        {renderColumn('Clinical Precedent', clinicalPrecedent)}
        {renderColumn('Biological Rationale', biologicalRationale)}
      </div>
    </div>
  );
}

