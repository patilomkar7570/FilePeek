import React, { useState } from 'react';
import { Info, Copy, Check, HardDrive, Calendar, FileType, ShieldCheck } from 'lucide-react';
import { GeneralFileInfo } from '../../../shared/types';
import { formatDate, formatExactBytes } from '../../../shared/formatters';

interface GeneralInfoCardProps {
  general: GeneralFileInfo;
}

export const GeneralInfoCard: React.FC<GeneralInfoCardProps> = ({ general }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="peek-card">
      <div className="peek-card-header">
        <div className="card-title-group">
          <Info size={16} className="card-title-icon" />
          <h3 className="card-title">General File Information</h3>
        </div>
        <span className="peek-badge badge-neutral">System Attributes</span>
      </div>

      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">File Name</span>
          <div className="info-value">
            <span>{general.fileName}</span>
            <button
              className="peek-btn-ghost"
              onClick={() => handleCopy('name', general.fileName)}
              title="Copy File Name"
              style={{ padding: '2px' }}
            >
              {copiedKey === 'name' ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">File Size</span>
          <div className="info-value">
            <span>{general.sizeFormatted}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({formatExactBytes(general.sizeBytes)})
            </span>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">Detected Format</span>
          <div className="info-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileType size={14} style={{ color: 'var(--accent)' }} />
              <span>{general.detectedFormat}</span>
            </div>
            <span className="peek-badge badge-neutral">{general.fileExtension || 'None'}</span>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">MIME Type</span>
          <div className="info-value mono">
            <span>{general.mimeType}</span>
            <button
              className="peek-btn-ghost"
              onClick={() => handleCopy('mime', general.mimeType)}
              title="Copy MIME type"
              style={{ padding: '2px' }}
            >
              {copiedKey === 'mime' ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        <div className="info-item" style={{ gridColumn: 'span 2' }}>
          <span className="info-label">Full File Path</span>
          <div className="info-value mono" style={{ fontSize: '11px' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
              {general.filePath}
            </span>
            <button
              className="peek-btn-ghost"
              onClick={() => handleCopy('path', general.filePath)}
              title="Copy Full Path"
              style={{ padding: '2px' }}
            >
              {copiedKey === 'path' ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">Creation Date</span>
          <div className="info-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
              <span>{formatDate(general.createdTime)}</span>
            </div>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">Last Modified Date</span>
          <div className="info-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
              <span>{formatDate(general.modifiedTime)}</span>
            </div>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">Last Accessed Date</span>
          <div className="info-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
              <span>{formatDate(general.accessedTime)}</span>
            </div>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">File Attributes</span>
          <div className="info-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`peek-badge ${general.isReadOnly ? 'badge-warning' : 'badge-neutral'}`}>
                {general.isReadOnly ? 'Read-Only' : 'Read/Write'}
              </span>
              {general.isHidden && <span className="peek-badge badge-neutral">Hidden</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
