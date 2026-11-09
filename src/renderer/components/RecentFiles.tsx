import React from 'react';
import {
  Clock,
  Trash2,
  X,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Cpu,
  FileCode,
  FileQuestion,
  AlertTriangle,
} from 'lucide-react';
import { RecentFile, FileCategory } from '../../shared/types';
import { formatDate } from '../../shared/formatters';

interface RecentFilesProps {
  recentFiles: RecentFile[];
  onSelectRecent: (filePath: string) => void;
  onRemoveRecent: (id: string) => void;
  onClearHistory: () => void;
}

export const RecentFiles: React.FC<RecentFilesProps> = ({
  recentFiles,
  onSelectRecent,
  onRemoveRecent,
  onClearHistory,
}) => {
  if (recentFiles.length === 0) {
    return null;
  }

  const getCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case 'image':
        return <FileImage size={18} style={{ color: '#28C76F' }} />;
      case 'video':
        return <FileVideo size={18} style={{ color: '#FFA143' }} />;
      case 'audio':
        return <FileAudio size={18} style={{ color: '#E53E3E' }} />;
      case 'pdf':
        return <FileText size={18} style={{ color: '#FF5C5C' }} />;
      case 'archive':
        return <FileArchive size={18} style={{ color: '#8B7CFF' }} />;
      case 'executable':
        return <Cpu size={18} style={{ color: '#38BDF8' }} />;
      case 'text':
        return <FileCode size={18} style={{ color: '#A78BFA' }} />;
      default:
        return <FileQuestion size={18} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  return (
    <div className="peek-card" style={{ marginTop: '24px' }}>
      <div className="peek-card-header">
        <div className="card-title-group">
          <Clock size={16} className="card-title-icon" />
          <h3 className="card-title">Recently Inspected Files</h3>
          <span className="peek-badge badge-neutral">{recentFiles.length}</span>
        </div>
        <button
          className="peek-btn peek-btn-ghost"
          onClick={onClearHistory}
          style={{ fontSize: '12px', padding: '4px 8px' }}
          title="Clear all recent files"
        >
          <Trash2 size={13} />
          <span>Clear History</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {recentFiles.map((file) => (
          <div
            key={file.id}
            onClick={() => {
              if (file.existsOnDisk) {
                onSelectRecent(file.filePath);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              cursor: file.existsOnDisk ? 'pointer' : 'not-allowed',
              opacity: file.existsOnDisk ? 1 : 0.6,
              transition: 'all var(--transition-fast)',
            }}
            className="recent-file-item"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid var(--border-color)',
                }}
              >
                {getCategoryIcon(file.category)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '360px',
                    }}
                    title={file.filePath}
                  >
                    {file.fileName}
                  </span>
                  {!file.existsOnDisk && (
                    <span className="peek-badge badge-warning" style={{ fontSize: '9px', padding: '1px 5px' }}>
                      <AlertTriangle size={10} />
                      <span>Moved / Deleted</span>
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>{file.detectedFormat}</span>
                  <span>•</span>
                  <span>{file.sizeFormatted}</span>
                  <span>•</span>
                  <span>{formatDate(file.inspectedAt)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="peek-btn peek-btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveRecent(file.id);
                }}
                style={{ padding: '6px', borderRadius: '50%' }}
                title="Remove from history"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
