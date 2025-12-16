/**
 * Patent Tile Template
 * Renders patent analysis data in tile format
 */

import { FileText, Scale, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import type { TileData, TileTemplate } from '../types';
import type { PatentExtractionResult } from '../../patentParsing/types';
import type { QualityAssessment } from '../../patentParsing/qualityAssurance';
import { AgentWalkthrough } from '../../../components/shared/AgentWalkthrough';

// Summary view (collapsed)
export function PatentSummaryView({ data }: { data: TileData }) {
  const extraction = data.detailed as PatentExtractionResult | any;
  const quality = data.metadata?.qualityAssessment as QualityAssessment | undefined;
  const summary = data.summary as any;

  // Check if this is a full PatentExtractionResult or extracted data
  const isFullExtraction = extraction && 'claims_analysis' in extraction;
  const isExtractedData = summary && 'patents' in summary;

  return (
    <div className="space-y-3">
      {(summary.citationsUsedCount || summary.hasReferencesSection) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
            {summary.citationsUsedCount ? `${summary.citationsUsedCount} citations` : 'Citations'}
          </span>
          {summary.hasReferencesSection ? (
            <span className="text-gray-500">refs included</span>
          ) : (
            <span className="text-gray-500">no refs section</span>
          )}
        </div>
      )}
      {/* Quality Badge */}
      {quality && (
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              quality.confidence_level === 'high'
                ? 'bg-green-100 text-green-700'
                : quality.confidence_level === 'medium'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {quality.confidence_level === 'high' ? 'High' : quality.confidence_level === 'medium' ? 'Medium' : 'Low'} Confidence
          </span>
          {quality.validation_status === 'validated' && (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          )}
        </div>
      )}

      {/* Key Metrics - Full Extraction */}
      {isFullExtraction && extraction.claims_analysis && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Claims</p>
            <p className="text-lg font-semibold text-gray-900">
              {extraction.claims_analysis.total_claims || 0}
            </p>
            <p className="text-xs text-gray-500">
              {extraction.claims_analysis.independent_claims || 0} independent
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Structures</p>
            <p className="text-lg font-semibold text-gray-900">
              {(extraction.molecular_data?.sequences?.small_molecules?.length || 0) +
               (extraction.molecular_data?.sequences?.antibodies?.length || 0)}
            </p>
            <p className="text-xs text-gray-500">extracted</p>
          </div>
        </div>
      )}

      {/* Key Metrics - Extracted Data */}
      {isExtractedData && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Patents</p>
            <p className="text-lg font-semibold text-gray-900">
              {summary.patentCount || 0}
            </p>
            <p className="text-xs text-gray-500">
              {summary.patents?.length || 0} shown
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">FTO Status</p>
            <p className={`text-sm font-medium ${
              summary.ftoStatus === 'CLEAR' ? 'text-green-700' :
              summary.ftoStatus === 'MODERATE RISK' ? 'text-yellow-700' :
              summary.ftoStatus === 'HIGH RISK' || summary.ftoStatus === 'BLOCKED' ? 'text-red-700' :
              'text-gray-700'
            }`}>
              {summary.ftoStatus || 'Not assessed'}
            </p>
          </div>
        </div>
      )}

      {/* Patent Info - Full Extraction */}
      {isFullExtraction && extraction.document_info?.patent_number && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Patent Number</p>
          <p className="text-sm font-medium text-gray-900">
            {extraction.document_info.patent_number}
          </p>
        </div>
      )}

      {/* Patent Info - Extracted Data */}
      {isExtractedData && summary.patents && summary.patents.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Patent Numbers</p>
          <div className="flex flex-wrap gap-1">
            {summary.patents.slice(0, 3).map((patent: string, idx: number) => (
              <p key={idx} className="text-sm font-medium text-gray-900">
                {patent}
              </p>
            ))}
          </div>
        </div>
      )}

      {isExtractedData && summary.royalties && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Royalty stack</p>
          <p className="text-sm font-medium text-gray-900">{summary.royalties}</p>
        </div>
      )}

      {/* Validation Flags - Full Extraction */}
      {isFullExtraction && extraction.validation_flags && extraction.validation_flags.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-yellow-600">
          <AlertTriangle className="w-3 h-3" />
          <span>{extraction.validation_flags.length} validation flag(s)</span>
        </div>
      )}
    </div>
  );
}

// Detailed view (expanded) - Now opens full analysis panel
export function PatentDetailedView({ data, onOpenFullPanel }: { data: TileData; onOpenFullPanel?: () => void }) {
  const extraction = data.detailed as PatentExtractionResult | any;
  const quality = data.metadata?.qualityAssessment as QualityAssessment | undefined;
  const ftoRiskData = data.metadata?.ftoRiskData;
  const isFullExtraction = extraction && 'claims_analysis' in extraction;

  // If this is extracted data (not full extraction), show simple view
  if (!isFullExtraction) {
    return (
      <div className="p-4">
        <AgentWalkthrough agent="patent" data={data} title="IP / Patent Walkthrough" />
      </div>
    );
  }

  // If onOpenFullPanel is provided, show a button to open the full panel
  if (onOpenFullPanel) {
    return (
      <div className="space-y-4 p-4">
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <p className="text-sm text-textPrimary mb-3">
            View comprehensive patent analysis with detailed claims, sequences, FTO assessment, and more.
          </p>
          <button
            onClick={onOpenFullPanel}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Open Full Analysis Panel
          </button>
        </div>
        {/* Show summary info - only for full extraction */}
        {isFullExtraction && extraction.claims_analysis && (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-textSecondary mb-1">Claims</p>
                <p className="text-lg font-semibold text-textPrimary">
                  {extraction.claims_analysis.total_claims || 0}
                </p>
                <p className="text-xs text-textSecondary">
                  {extraction.claims_analysis.independent_claims || 0} independent
                </p>
              </div>
              <div>
                <p className="text-textSecondary mb-1">Sequences</p>
                <p className="text-lg font-semibold text-textPrimary">
                  {(extraction.molecular_data?.sequences?.antibodies?.length || 0) +
                   (extraction.molecular_data?.sequences?.nucleic_acids?.length || 0)}
                </p>
                <p className="text-xs text-textSecondary">extracted</p>
              </div>
            </div>
            
            {/* Deep Analysis Summary */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <h4 className="text-sm font-semibold text-textPrimary mb-3">Analysis Summary</h4>
              <div className="space-y-2 text-sm text-textSecondary">
                {extraction.claims_analysis.total_claims > 0 && (
                  <p>
                    • <strong className="text-textPrimary">{extraction.claims_analysis.total_claims} claims</strong> identified ({extraction.claims_analysis.independent_claims} independent)
                  </p>
                )}
                {(extraction.molecular_data?.sequences?.antibodies?.length || 0) > 0 && (
                  <p>
                    • <strong className="text-textPrimary">{extraction.molecular_data.sequences.antibodies.length} antibodies</strong> extracted with CDR sequences
                  </p>
                )}
                {(extraction.molecular_data?.sequences?.nucleic_acids?.length || 0) > 0 && (
                  <p>
                    • <strong className="text-textPrimary">{extraction.molecular_data.sequences.nucleic_acids.length} nucleic acid sequences</strong> identified
                  </p>
                )}
                {(extraction.molecular_data?.sequences?.small_molecules?.length || 0) > 0 && (
                  <p>
                    • <strong className="text-textPrimary">{extraction.molecular_data.sequences.small_molecules.length} small molecules</strong> extracted
                  </p>
                )}
                {extraction.fto_relevant_data && (
                  <p>
                    • <strong className="text-textPrimary">FTO assessment</strong> available - {extraction.fto_relevant_data.genus_scope || 'scope analyzed'}
                  </p>
                )}
                {quality && (
                  <p>
                    • <strong className="text-textPrimary">Quality:</strong> {(quality.overall_confidence * 100).toFixed(0)}% confidence, {quality.validation_status}
                  </p>
                )}
                {(extraction.validation_flags?.length || 0) > 0 && (
                  <p className="text-warning">
                    • ⚠️ <strong>{extraction.validation_flags.length} validation flag(s)</strong> require review
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Only show full detailed view for full extraction
  if (!isFullExtraction) {
    return null; // Already handled above
  }

  return (
    <div className="space-y-4">
      {/* Document Information */}
      {extraction.document_info && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Document Information</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {extraction.document_info.patent_number && (
              <div>
                <p className="text-gray-500">Patent Number</p>
                <p className="font-medium text-gray-900">{extraction.document_info.patent_number}</p>
              </div>
            )}
            {extraction.document_info.assignee && (
              <div>
                <p className="text-gray-500">Assignee</p>
                <p className="font-medium text-gray-900">{extraction.document_info.assignee}</p>
              </div>
            )}
            {extraction.document_info.publication_date && (
              <div>
                <p className="text-gray-500">Publication Date</p>
                <p className="font-medium text-gray-900">{extraction.document_info.publication_date}</p>
              </div>
            )}
            {extraction.document_info.priority_date && (
              <div>
                <p className="text-gray-500">Priority Date</p>
                <p className="font-medium text-gray-900">{extraction.document_info.priority_date}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Claims Analysis */}
      {extraction.claims_analysis && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Claims Analysis</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {extraction.claims_analysis.total_claims || 0}
              </p>
              <p className="text-xs text-gray-600">Total Claims</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {extraction.claims_analysis.independent_claims || 0}
              </p>
              <p className="text-xs text-gray-600">Independent</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {(extraction.claims_analysis.total_claims || 0) - (extraction.claims_analysis.independent_claims || 0)}
              </p>
              <p className="text-xs text-gray-600">Dependent</p>
            </div>
          </div>
        </div>
      )}

      {/* Molecular Data Summary */}
      {extraction.molecular_data?.sequences && 
        ((extraction.molecular_data.sequences.small_molecules?.length || 0) > 0 ||
         (extraction.molecular_data.sequences.antibodies?.length || 0) > 0 ||
         (extraction.molecular_data.sequences.nucleic_acids?.length || 0) > 0) && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Molecular Data</h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {(extraction.molecular_data.sequences.antibodies?.length || 0) > 0 && (
              <div className="p-2 bg-blue-50 rounded">
                <p className="font-medium text-gray-900">
                  {extraction.molecular_data.sequences.antibodies.length}
                </p>
                <p className="text-xs text-gray-600">Antibodies</p>
              </div>
            )}
            {(extraction.molecular_data.sequences.small_molecules?.length || 0) > 0 && (
              <div className="p-2 bg-green-50 rounded">
                <p className="font-medium text-gray-900">
                  {extraction.molecular_data.sequences.small_molecules.length}
                </p>
                <p className="text-xs text-gray-600">Small Molecules</p>
              </div>
            )}
            {(extraction.molecular_data.sequences.nucleic_acids?.length || 0) > 0 && (
              <div className="p-2 bg-orange-50 rounded">
                <p className="font-medium text-gray-900">
                  {extraction.molecular_data.sequences.nucleic_acids.length}
                </p>
                <p className="text-xs text-gray-600">Nucleic Acids</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quality Assessment */}
      {quality && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Quality Assessment</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Overall Confidence</span>
              <span className="text-sm font-medium text-gray-900">
                {(quality.overall_confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Validation Status</span>
              <span
                className={`text-sm font-medium ${
                  quality.validation_status === 'validated'
                    ? 'text-green-600'
                    : quality.validation_status === 'review_required'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {quality.validation_status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {quality.flags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">
                  {quality.flags.length} validation flag(s)
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {quality.flags.slice(0, 3).map((flag, idx) => (
                    <div key={idx} className="text-xs text-gray-600">
                      • {flag.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FTO Relevant Data */}
      {extraction.fto_relevant_data && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">FTO Assessment</h4>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <strong>Genus Scope:</strong> {extraction.fto_relevant_data.genus_scope}
            </p>
            {extraction.fto_relevant_data.key_limitations_for_fto.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-600 mb-1">Key Limitations:</p>
                <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                  {extraction.fto_relevant_data.key_limitations_for_fto.slice(0, 3).map((lim: string, idx: number) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Patent tile template definition
export const patentTileTemplate: Omit<TileTemplate, 'renderSummary' | 'renderDetailed'> = {
  type: 'patent',
  agent: 'patent',
  name: 'Patent Analysis',
  description: 'Patent document analysis with claims, structures, and FTO assessment',
  defaultSize: 'large',
  icon: '⚖️',
  color: 'purple',
};
