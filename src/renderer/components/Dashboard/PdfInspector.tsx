import React from 'react';
import { FileText, BookOpen, User, Lock, Calendar, Layers, ShieldCheck } from 'lucide-react';
import { PdfMetadata } from '../../../shared/types';

interface PdfInspectorProps {
  pdf: PdfMetadata;
}

export const PdfInspector: React.FC<PdfInspectorProps> = ({ pdf }) => {
  return (
    <div className="peek-card">
      <div className="peek-card-header">
        <div className="card-title-group">
          <FileText size={16} className="card-title-icon" />
          <h3 className="card-title">PDF Document Structure & Metadata</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {pdf.isEncrypted && (
            <span className="peek-badge badge-warning">
              <Lock size={11} />
              <span>Password Protected / Encrypted</span>
            </span>
          )}
          <span className="peek-badge badge-accent">{pdf.pdfVersion || 'PDF Document'}</span>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Page Count</span>
          <div className="info-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '15px' }}>{pdf.pageCount} {pdf.pageCount === 1 ? 'page' : 'pages'}</span>
            </div>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">PDF Specification</span>
          <div className="info-value mono">
            <span>{pdf.pdfVersion || 'Standard PDF'}</span>
          </div>
        </div>

        {pdf.title && (
          <div className="info-item" style={{ gridColumn: 'span 2' }}>
            <span className="info-label">Document Title</span>
            <div className="info-value">
              <span>{pdf.title}</span>
            </div>
          </div>
        )}

        {pdf.author && (
          <div className="info-item">
            <span className="info-label">Author</span>
            <div className="info-value">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} style={{ color: 'var(--text-muted)' }} />
                <span>{pdf.author}</span>
              </div>
            </div>
          </div>
        )}

        {pdf.subject && (
          <div className="info-item">
            <span className="info-label">Subject</span>
            <div className="info-value">
              <span>{pdf.subject}</span>
            </div>
          </div>
        )}

        {pdf.creator && (
          <div className="info-item">
            <span className="info-label">Creator Tool</span>
            <div className="info-value">
              <span>{pdf.creator}</span>
            </div>
          </div>
        )}

        {pdf.producer && (
          <div className="info-item">
            <span className="info-label">PDF Producer</span>
            <div className="info-value">
              <span>{pdf.producer}</span>
            </div>
          </div>
        )}

        {pdf.creationDate && (
          <div className="info-item">
            <span className="info-label">Document Created</span>
            <div className="info-value">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                <span>{pdf.creationDate}</span>
              </div>
            </div>
          </div>
        )}

        {pdf.modificationDate && (
          <div className="info-item">
            <span className="info-label">Document Modified</span>
            <div className="info-value">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                <span>{pdf.modificationDate}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: '16px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
        }}
      >
        <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
        <span>Inspected 100% locally in isolated memory without invoking external readers or cloud services.</span>
      </div>
    </div>
  );
};
