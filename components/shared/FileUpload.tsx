'use client';

import { useState, useCallback } from 'react';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'processed' | 'error';
  preview?: string;
  extractedText?: string;
  error?: string;
}

interface FileUploadProps {
  onFilesProcessed: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

export default function FileUpload({
  onFilesProcessed,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} not supported`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }
    return null;
  };

  const processFiles = async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const error = validateFile(file);

      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: error ? 'error' : 'pending',
        error: error || undefined,
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          setFiles(prev => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploadedFile);
    }

    if (files.length + newFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);

    // Process files via API
    await uploadAndProcessFiles(newFiles);
  };

  const uploadAndProcessFiles = async (filesToProcess: UploadedFile[]) => {
    setIsProcessing(true);

    for (const uploadedFile of filesToProcess) {
      if (uploadedFile.status === 'error') continue;

      try {
        // Update status to uploading
        setFiles(prev =>
          prev.map(f => f.id === uploadedFile.id ? { ...f, status: 'uploading' as const } : f)
        );

        const formData = new FormData();
        formData.append('file', uploadedFile.file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        // Check response status first, then parse JSON
        if (!response.ok) {
          let errorMessage = 'Upload failed';
          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } catch (jsonError) {
            // If JSON parsing fails, use status text
            console.error('Failed to parse error response:', jsonError);
            errorMessage = `Upload failed: ${response.statusText} (${response.status})`;
          }
          throw new Error(errorMessage);
        }

        // Only parse JSON if response was successful
        const data = await response.json();

        // Log extracted text for debugging
        console.log('=== Extracted Text ===');
        console.log(`File: ${uploadedFile.name}`);
        console.log(`Text length: ${data.text?.length || 0} characters`);
        console.log('First 500 characters:', data.text?.substring(0, 500));
        console.log('==================');

        // Update with processed data
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadedFile.id
              ? { ...f, status: 'processed' as const, extractedText: data.text }
              : f
          )
        );
      } catch (error: any) {
        console.error('Upload error:', error);
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadedFile.id
              ? { ...f, status: 'error' as const, error: error.message || 'Failed to process file' }
              : f
          )
        );
      }
    }

    setIsProcessing(false);

    // Notify parent component
    const processedFiles = files.filter(f => f.status === 'processed');
    if (processedFiles.length > 0) {
      onFilesProcessed(processedFiles);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const { files: droppedFiles } = e.dataTransfer;
    if (droppedFiles && droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [files, maxFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing || files.length >= maxFiles}
        />

        <div className="pointer-events-none">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PDF, Excel, CSV, TXT, or Images (max {maxSizeMB}MB, {maxFiles} files)
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              Uploaded Files ({files.length}/{maxFiles})
            </h4>
            <button
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center flex-1 min-w-0">
                  {/* File Icon or Preview */}
                  <div className="flex-shrink-0 w-10 h-10 mr-3">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0 ml-4">
                    {file.status === 'pending' && (
                      <span className="text-xs text-gray-500">Pending</span>
                    )}
                    {file.status === 'uploading' && (
                      <span className="text-xs text-blue-600">Uploading...</span>
                    )}
                    {file.status === 'processed' && (
                      <span className="text-xs text-green-600">✓ Processed</span>
                    )}
                    {file.status === 'error' && (
                      <div className="text-xs text-red-600">
                        <div className="font-semibold">✗ Error</div>
                        {file.error && (
                          <div className="text-red-500 mt-1 max-w-xs">
                            {file.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Extracted Text Preview */}
                {file.status === 'processed' && file.extractedText && (
                  <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Extracted Text Preview ({file.extractedText.length} characters):
                    </p>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                      {file.extractedText.substring(0, 300)}
                      {file.extractedText.length > 300 && '...'}
                    </p>
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="ml-4 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
