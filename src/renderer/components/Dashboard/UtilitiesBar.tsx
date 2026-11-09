import React, { useState } from 'react';
import {
  Download,
  FolderOpen,
  ExternalLink,
  Copy,
  Check,
  FileCode,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { FileInspectionResult } from '../../../shared/types';

interface UtilitiesBarProps {
  result: FileInspectionResult;
  onRevealInExplorer: () => void;
  onOpenFile: () => void;
  onCopyAllSummary: () => void;
  isSummaryCopied: boolean;
}

export const UtilitiesBar: React.FC<UtilitiesBarProps> = ({
  result,
  onRevealInExplorer,
  onOpenFile,
  onCopyAllSummary,
  isSummaryCopied,
}) => {
  const [exportingFormat, setExportingFormat] = useState<'txt' | 'json' | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleExport = async (format: 'txt' | 'json') => {
    setExportingFormat(format);
    setStatusMessage(null);
    try {
      const res = await window.filePeekApi?.exportReport({
        format,
        result,
      });

      if (res && res.success) {
        setStatusMessage({ text: `Report exported successfully as ${format.toUpperCase()}`, type: 'success' });
        setTimeout(() => setStatusMessage(null), 3500);
      } else if (res && res.error) {
        setStatusMessage({ text: res.error, type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Export failed.', type: 'error' });
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="peek-card">
      <div className="peek-card-header">
        <div className="card-title-group">
          <Download size={16} className="card-title-icon" />
          <h3 className="card-title">File Utilities & Report Export</h3>
        </div>
        <span className="peek-badge badge-neutral">Offline Tools</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Export Report Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Export Inspection Report:
            </span>

            <button
              className="peek-btn peek-btn-secondary"
              onClick={() => handleExport('txt')}
              disabled={exportingFormat !== null}
              title="Export structured plaintext report"
            >
              <FileText size={14} />
              <span>{exportingFormat === 'txt' ? 'Exporting...' : 'Export Plaintext (.txt)'}</span>
            </button>

            <button
              className="peek-btn peek-btn-secondary"
              onClick={() => handleExport('json')}
              disabled={exportingFormat !== null}
              title="Export complete technical report as JSON"
            >
              <FileCode size={14} />
              <span>{exportingFormat === 'json' ? 'Exporting...' : 'Export JSON (.json)'}</span>
            </button>
          </div>

          {/* Quick System Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="peek-btn peek-btn-secondary"
              onClick={onCopyAllSummary}
              title="Copy complete markdown summary to clipboard"
            >
              {isSummaryCopied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
              <span>{isSummaryCopied ? 'Summary Copied' : 'Copy Summary'}</span>
            </button>

            <button
              className="peek-btn peek-btn-secondary"
              onClick={onRevealInExplorer}
              title="Reveal in Windows File Explorer"
            >
              <FolderOpen size={14} />
              <span>Reveal in Explorer</span>
            </button>

            <button
              className="peek-btn peek-btn-primary"
              onClick={onOpenFile}
              title="Open file using default Windows application (explicit user action)"
            >
              <ExternalLink size={14} />
              <span>Open in Default App</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: statusMessage.type === 'success' ? 'var(--success-subtle)' : 'var(--danger-subtle)',
              border: `1px solid ${statusMessage.type === 'success' ? 'rgba(40, 199, 111, 0.25)' : 'rgba(255, 92, 92, 0.25)'}`,
              fontSize: '12px',
              color: statusMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {statusMessage.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
