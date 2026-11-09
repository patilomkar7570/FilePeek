import React, { useState } from 'react';
import {
  UploadCloudIcon,
  FolderOpenIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  PdfIcon,
  ArchiveIcon,
  CodeIcon,
  FileIcon,
  ShieldCheckIcon,
  ClockIcon,
  Trash2Icon,
  XIcon,
  AlertTriangleIcon,
} from './Icons';
import { RecentFileRecord, FileCategory } from '../../../shared/types';

interface HomeViewProps {
  onFileSelected: (filePath: string) => void;
  onBrowseClick: () => void;
  recentFiles: RecentFileRecord[];
  onRemoveRecent: (idOrPath: string) => void;
  onClearRecents: () => void;
  isHistoryEnabled: boolean;
  isLoading: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onFileSelected,
  onBrowseClick,
  recentFiles,
  onRemoveRecent,
  onClearRecents,
  isHistoryEnabled,
  isLoading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // In Electron renderer, File objects have a 'path' property
      const filePath = (file as any).path || file.name;
      onFileSelected(filePath);
    }
  };

  const getCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case 'image': return <ImageIcon size={18} />;
      case 'video': return <VideoIcon size={18} />;
      case 'audio': return <MusicIcon size={18} />;
      case 'pdf': return <PdfIcon size={18} />;
      case 'archive': return <ArchiveIcon size={18} />;
      case 'code': return <CodeIcon size={18} />;
      default: return <FileIcon size={18} />;
    }
  };

  return (
    <div className="home-view">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-tag">
          <ShieldCheckIcon size={14} />
          <span>Local File Intelligence</span>
        </div>
        <h2 className="hero-title">KNOW YOUR FILES.</h2>
        <p className="hero-subtitle">
          Drop any file to explore its properties, format and technical details.
        </p>
      </div>

      {/* Primary Drop Zone */}
      <div
        className={`dropzone-card ${isDragOver ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onBrowseClick}
      >
        <div className="drop-icon-circle">
          <UploadCloudIcon size={32} />
        </div>
        <div className="drop-primary-text">
          {isLoading ? 'Inspecting file...' : 'Drop any file here to inspect'}
        </div>
        <div className="drop-secondary-text">
          Instant format verification, magic bytes inspection, metadata & hashes
        </div>
        <button
          className="btn-browse"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBrowseClick();
          }}
          disabled={isLoading}
        >
          <FolderOpenIcon size={17} />
          <span>Browse Files</span>
        </button>
      </div>

      {/* Supported Categories Pills */}
      <div className="category-pills-row">
        <div className="category-pill"><ImageIcon size={14} /><span>Images</span></div>
        <div className="category-pill"><VideoIcon size={14} /><span>Videos</span></div>
        <div className="category-pill"><MusicIcon size={14} /><span>Audio</span></div>
        <div className="category-pill"><PdfIcon size={14} /><span>PDFs</span></div>
        <div className="category-pill"><ArchiveIcon size={14} /><span>Archives</span></div>
        <div className="category-pill"><CodeIcon size={14} /><span>Code & Data</span></div>
        <div className="category-pill"><FileIcon size={14} /><span>Documents</span></div>
      </div>

      {/* Privacy Notice */}
      <div className="privacy-badge-card">
        <ShieldCheckIcon size={18} />
        <span>
          <strong>100% Offline & Private:</strong> Files never leave your computer. All magic-byte detection, metadata extraction, and hash calculations occur strictly in your local environment.
        </span>
      </div>

      {/* Recent Files Section */}
      {isHistoryEnabled && recentFiles.length > 0 && (
        <section className="recents-section">
          <div className="section-header">
            <span className="section-title">
              <ClockIcon size={15} />
              <span>Recently Inspected ({recentFiles.length})</span>
            </span>
            <button
              className="btn-ghost-sm"
              onClick={onClearRecents}
              title="Clear all recent entries"
            >
              Clear History
            </button>
          </div>

          <div className="recents-grid">
            {recentFiles.map((item) => (
              <div
                key={item.id}
                className="recent-card"
                onClick={() => {
                  if (item.exists) {
                    onFileSelected(item.filePath);
                  }
                }}
                style={{ opacity: item.exists ? 1 : 0.6 }}
                title={item.exists ? `Reopen ${item.filePath}` : 'File moved or deleted'}
              >
                <div className="recent-icon-wrapper">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="recent-info">
                  <div className="recent-name">{item.fileName}</div>
                  <div className="recent-meta">
                    <span>{item.fileSizeFormatted}</span>
                    <span>•</span>
                    <span>{item.detectedFormat}</span>
                    {!item.exists && (
                      <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}> (Moved)</span>
                    )}
                  </div>
                </div>
                <div className="recent-actions">
                  <button
                    className="btn-icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecent(item.id);
                    }}
                    title="Remove from history"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
