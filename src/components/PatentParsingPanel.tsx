/**
 * Patent Parsing Panel Component
 * UI for uploading and parsing patent documents
 * Designed to be used in the right panel (SonnySidePanel)
 */

import { useState, useCallback } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, X, Download, Plus } from 'lucide-react';
import type { PatentExtractionResult } from '../lib/patentParsing/types';
import type { QualityAssessment } from '../lib/patentParsing/qualityAssurance';
import CreateTileModal from './CreateTileModal';

interface PatentParsingPanelProps {
  onParsed?: (result: PatentExtractionResult) => void;
  className?: string;
}

export default function PatentParsingPanel({ onParsed, className = '' }: PatentParsingPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedResult, setParsedResult] = useState<PatentExtractionResult | null>(null);
  const [qualityAssessment, setQualityAssessment] = useState<QualityAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCreateTileModal, setShowCreateTileModal] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/xml',
      'text/xml',
      'text/html',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, XML, HTML, DOCX, or TXT files.');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit.');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setParsedResult(null);
    setQualityAssessment(null);
  }, []);

  const handleParse = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('extract_structures', 'true');
      formData.append('extract_sequences', 'true');
      formData.append('extract_biological_data', 'true');
      formData.append('resolve_cross_references', 'true');
      formData.append('validate_data', 'true');

      // Simulate progress (actual progress would come from server)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/patent-parsing/parse', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse patent document');
      }

      const data = await response.json();
      
      if (data.success && data.extraction && data.quality) {
        setParsedResult(data.extraction);
        setQualityAssessment(data.quality);
        
        if (onParsed) {
          onParsed(data.extraction);
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Patent parsing error:', err);
      setError(err.message || 'Failed to parse patent document');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, onParsed]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setParsedResult(null);
    setQualityAssessment(null);
    setError(null);
    setUploadProgress(0);
  }, []);

  const handleDownloadResults = useCallback(() => {
    if (!parsedResult) return;

    const dataStr = JSON.stringify(parsedResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `patent-parsing-${parsedResult.document_info.patent_number || 'result'}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [parsedResult]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Patent Parser</h3>
        </div>
        {parsedResult && (
          <button
            onClick={handleClear}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title="Clear results"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!parsedResult ? (
          <>
            {/* Upload Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Patent Document
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    id="patent-file-input"
                    className="hidden"
                    accept=".pdf,.xml,.html,.docx,.txt"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="patent-file-input"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : 'Click to select or drag and drop'}
                    </span>
                    <span className="text-xs text-gray-500">
                      PDF, XML, HTML, DOCX, or TXT (max 50MB)
                    </span>
                  </label>
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={handleParse}
                    disabled={isUploading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Parsing...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Parse Document</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Extracting data... {uploadProgress}%
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Results Section */}
            <div className="space-y-4">
              {/* Quality Assessment */}
              {qualityAssessment && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Quality Assessment</h4>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        qualityAssessment.confidence_level === 'high'
                          ? 'bg-green-100 text-green-700'
                          : qualityAssessment.confidence_level === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {getConfidenceBadge(qualityAssessment.overall_confidence)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Overall Confidence</span>
                      <span className={`font-medium ${getConfidenceColor(qualityAssessment.overall_confidence)}`}>
                        {(qualityAssessment.overall_confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Validation Status</span>
                      <span
                        className={`font-medium ${
                          qualityAssessment.validation_status === 'validated'
                            ? 'text-green-600'
                            : qualityAssessment.validation_status === 'review_required'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {qualityAssessment.validation_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Info */}
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Document Information</h4>
                <div className="space-y-2 text-sm">
                  {parsedResult.document_info.patent_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patent Number</span>
                      <span className="font-medium text-gray-900">
                        {parsedResult.document_info.patent_number}
                      </span>
                    </div>
                  )}
                  {parsedResult.document_info.title && (
                    <div>
                      <span className="text-gray-600">Title</span>
                      <p className="font-medium text-gray-900 mt-1">
                        {parsedResult.document_info.title}
                      </p>
                    </div>
                  )}
                  {parsedResult.document_info.assignee && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assignee</span>
                      <span className="font-medium text-gray-900">
                        {parsedResult.document_info.assignee}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Claims Summary */}
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Claims Analysis</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Claims</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {parsedResult.claims_analysis.total_claims}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Independent Claims</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {parsedResult.claims_analysis.independent_claims}
                    </p>
                  </div>
                </div>
              </div>

              {/* Molecular Data Summary */}
              {(parsedResult.molecular_data.sequences.antibodies.length > 0 ||
                parsedResult.molecular_data.sequences.small_molecules.length > 0 ||
                parsedResult.molecular_data.sequences.nucleic_acids.length > 0) && (
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Molecular Data</h4>
                  <div className="space-y-2 text-sm">
                    {parsedResult.molecular_data.sequences.antibodies.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Antibodies</span>
                        <span className="font-medium text-gray-900">
                          {parsedResult.molecular_data.sequences.antibodies.length} found
                        </span>
                      </div>
                    )}
                    {parsedResult.molecular_data.sequences.small_molecules.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Small Molecules</span>
                        <span className="font-medium text-gray-900">
                          {parsedResult.molecular_data.sequences.small_molecules.length} found
                        </span>
                      </div>
                    )}
                    {parsedResult.molecular_data.sequences.nucleic_acids.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nucleic Acids</span>
                        <span className="font-medium text-gray-900">
                          {parsedResult.molecular_data.sequences.nucleic_acids.length} found
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Validation Flags */}
              {parsedResult.validation_flags.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                    Validation Flags ({parsedResult.validation_flags.length})
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {parsedResult.validation_flags.slice(0, 5).map((flag, idx) => (
                      <div key={idx} className="text-xs text-yellow-800">
                        • {flag.message}
                      </div>
                    ))}
                    {parsedResult.validation_flags.length > 5 && (
                      <div className="text-xs text-yellow-600 italic">
                        +{parsedResult.validation_flags.length - 5} more...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateTileModal(true)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Dashboard</span>
                </button>
                <button
                  onClick={handleDownloadResults}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Tile Modal */}
      {parsedResult && qualityAssessment && (
        <CreateTileModal
          isOpen={showCreateTileModal}
          onClose={() => setShowCreateTileModal(false)}
          onSuccess={(tileId) => {
            // Optionally show success message or navigate
            console.log('Tile created:', tileId);
          }}
          initialData={{
            title: `Patent Analysis: ${parsedResult.document_info.patent_number || parsedResult.document_info.title || 'Untitled'}`,
            subtitle: parsedResult.document_info.title || undefined,
            type: 'patent',
            agent: 'patent',
            sourceData: {
              fileName: selectedFile?.name,
              fileSize: selectedFile?.size,
            },
            analysisData: parsedResult,
            qualityData: qualityAssessment,
          }}
        />
      )}
    </div>
  );
}
