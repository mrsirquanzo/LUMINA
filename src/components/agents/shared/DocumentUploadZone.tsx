import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
}

interface DocumentUploadZoneProps {
  themeColor: 'blue' | 'purple' | 'green' | 'cyan' | 'orange' | 'emerald';
  onFilesUploaded: (files: File[]) => void;
  acceptedTypes?: string[]; // e.g., ['.pdf', '.docx', '.xlsx']
  maxFiles?: number;
  maxSizeMB?: number;
  compact?: boolean;
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
  themeColor,
  onFilesUploaded,
  acceptedTypes = ['.pdf', '.docx', '.xlsx', '.csv', '.txt'],
  maxFiles = 5,
  maxSizeMB = 25,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  }, []);

  const processFiles = (files: File[]) => {
    // Validate and add files
    const validFiles = files.slice(0, maxFiles).filter(f => f.size <= maxSizeMB * 1024 * 1024);

    const newUploadedFiles: UploadedFile[] = validFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      size: f.size,
      type: f.type,
      status: 'success' as const,
      progress: 100,
    }));

    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
    onFilesUploaded(validFiles);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const colorClasses = {
    blue: 'border-blue-500/30 hover:border-blue-400 bg-blue-500/5',
    purple: 'border-purple-500/30 hover:border-purple-400 bg-purple-500/5',
    green: 'border-green-500/30 hover:border-green-400 bg-green-500/5',
    cyan: 'border-cyan-500/30 hover:border-cyan-400 bg-cyan-500/5',
    orange: 'border-orange-500/30 hover:border-orange-400 bg-orange-500/5',
    emerald: 'border-emerald-500/30 hover:border-emerald-400 bg-emerald-500/5',
  };

  const iconColorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    cyan: 'text-cyan-400',
    orange: 'text-orange-400',
    emerald: 'text-emerald-400',
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        animate={{ scale: isDragging ? 1.02 : 1 }}
        className={`
          relative border-2 border-dashed rounded-xl transition-all
          ${colorClasses[themeColor]}
          ${isDragging ? 'border-opacity-100' : 'border-opacity-50'}
          ${compact ? 'p-4' : 'p-6'}
        `}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center text-center">
          <Upload className={`w-8 h-8 mb-2 ${iconColorClasses[themeColor]}`} />
          {!compact && (
            <>
              <p className="text-white font-medium mb-1">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-gray-500">
                {acceptedTypes.join(', ')} up to {maxSizeMB}MB
              </p>
            </>
          )}
          {compact && (
            <p className="text-sm text-gray-400">Upload Documents</p>
          )}
        </div>
      </motion.div>

      {/* Uploaded Files List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {uploadedFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <FileText className="w-5 h-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {file.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

