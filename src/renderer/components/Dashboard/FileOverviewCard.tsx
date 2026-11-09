import React from 'react';
import {
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileArchive,
  Cpu,
  FileCode,
  FileQuestion,
  ExternalLink,
  FolderOpen,
  Copy,
  Check,
} from 'lucide-react';
import { FileInspectionResult } from '../../../shared/types';
import { formatExactBytes } from '../../../shared/formatters';

interface FileOverviewCardProps {
  result: FileInspectionResult;
  onRevealInExplorer: () => void;
  onOpenFile: () => void;
  onCopyAllSummary: () => void;
  isCopied: boolean;
}

export const FileOverviewCard: React.FC<FileOverviewCardProps> = ({
  result,
  onRevealInExplorer,
  onOpenFile,
  onCopyAllSummary,
  isCopied,
}) => {
  const { general, category, verification } = result;

  const getCategoryHeroIcon = () => {
    const size = 32;
    switch (category) {
      case 'image':
        return <FileImage size={size} style={{ color: '#28C76F' }} />;
      case 'video':
        return <FileVideo size={size} style={{ color: '#FFA143' }} />;
      case 'audio':
        return <FileAudio size={size} style={{ color: '#E53E3E' }} />;
      case 'pdf':
        return <FileText size={size} style={{ color: '#FF5C5C' }} />;
      case 'archive':
        return <FileArchive size={size} style={{ color: '#8B7CFF' }} />;
      case 'executable':
        return <Cpu size={size} style={{ color: '#38BDF8' }} />;
      case 'text':
        return <FileCode size={size} style={{ color: '#A78BFA' }} />;
      default:
        return <FileQuestion size={size} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  return (
    <div className="peek-card" style={{ background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-input) 100%)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}
          >
            {getCategoryHeroIcon()}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  letterSpacing: '-0.3px',
                  color: 'var(--text-primary)',
                  wordBreak: 'break-all',
                }}
              >
                {general.fileName}
              </h1>
              <span className="peek-badge badge-accent">
                {general.fileExtension || 'NO EXT'}
              </span>
              <span className="peek-badge badge-neutral">
                {general.detectedFormat}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {general.sizeFormatted} ({formatExactBytes(general.sizeBytes)}) • {general.mimeType}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="peek-btn peek-btn-secondary"
            onClick={onCopyAllSummary}
            title="Copy structured summary to clipboard"
          >
            {isCopied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
            <span>{isCopied ? 'Copied' : 'Copy Summary'}</span>
          </button>

          <button
            className="peek-btn peek-btn-secondary"
            onClick={onRevealInExplorer}
            title="Reveal in Windows File Explorer"
          >
            <FolderOpen size={14} />
            <span>Reveal</span>
          </button>

          <button
            className="peek-btn peek-btn-primary"
            onClick={onOpenFile}
            title="Open with default Windows application (explicit user action)"
          >
            <ExternalLink size={14} />
            <span>Open File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
