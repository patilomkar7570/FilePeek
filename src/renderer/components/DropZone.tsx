import React, { useState, useRef } from 'react';
import { UploadCloud, FolderOpen, Loader2 } from 'lucide-react';

interface DropZoneProps {
  onFileSelected: (filePath: string) => void;
  isLoading: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelected, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // In Electron renderer, File object has .path property
      const filePath = (file as any).path;
      if (filePath) {
        onFileSelected(filePath);
      }
    }
  };

  const handleBrowseClick = async () => {
    if (isLoading) return;
    try {
      if (window.filePeekApi?.selectFileWithDialog) {
        const selectedPath = await window.filePeekApi.selectFileWithDialog();
        if (selectedPath) {
          onFileSelected(selectedPath);
        }
      } else if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } catch (err) {
      console.error('File selection error:', err);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const filePath = (file as any).path;
      if (filePath) {
        onFileSelected(filePath);
      }
    }
  };

  return (
    <section
      className={`dropzone-container ${isDragging ? 'is-dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBrowseClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      <div className="dropzone-icon-circle">
        {isLoading ? (
          <Loader2 size={36} className="animate-spin" />
        ) : (
          <UploadCloud size={36} />
        )}
      </div>

      <h2 className="dropzone-title">KNOW YOUR FILES.</h2>
      <p className="dropzone-subtitle">
        Drop any file to explore its properties, format and technical details.
      </p>

      <div style={{ display: 'flex', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
        <button
          className="peek-btn peek-btn-primary"
          onClick={handleBrowseClick}
          disabled={isLoading}
          style={{ padding: '10px 20px', fontSize: '14px' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Inspecting File...</span>
            </>
          ) : (
            <>
              <FolderOpen size={16} />
              <span>Browse Files</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
