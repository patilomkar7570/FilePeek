import React, { useState } from 'react';
import { Binary, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { FallbackMetadata } from '../../../shared/types';

interface HexViewerProps {
  fallback?: FallbackMetadata;
  initialExpanded?: boolean;
}

export const HexViewer: React.FC<HexViewerProps> = ({ fallback, initialExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [copied, setCopied] = useState(false);

  if (!fallback || !fallback.headerHexPreview || fallback.headerHexPreview.length === 0) {
    return null;
  }

  const handleCopyHex = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = fallback.headerHexPreview
      .map((row) => `${row.offset}  ${row.hex.slice(0, 8).join(' ')}  ${row.hex.slice(8).join(' ')}  |${row.ascii}|`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="peek-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          cursor: 'pointer',
          backgroundColor: 'var(--bg-card)',
          transition: 'background-color var(--transition-fast)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Binary size={16} className="card-title-icon" />
          <h3 className="card-title">Raw Binary Header Inspection (Hex Dump)</h3>
          <span className="peek-badge badge-neutral">First 128 Bytes</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isExpanded && (
            <button
              className="peek-btn peek-btn-ghost"
              onClick={handleCopyHex}
              style={{ fontSize: '11px', padding: '4px 8px' }}
              title="Copy hex dump to clipboard"
            >
              {copied ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy Hex'}</span>
            </button>
          )}

          <div style={{ color: 'var(--text-secondary)' }}>
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '0 20px 20px 20px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {fallback.note}
          </p>

          <div
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              lineHeight: 1.6,
              overflowX: 'auto',
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', color: 'var(--text-muted)', marginBottom: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
              <span style={{ width: '80px' }}>OFFSET</span>
              <span style={{ flex: 1, letterSpacing: '1px' }}>00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F</span>
              <span style={{ width: '130px', textAlign: 'right' }}>DECODED ASCII</span>
            </div>

            {/* Hex rows */}
            {fallback.headerHexPreview.map((row, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '80px', color: 'var(--accent)' }}>{row.offset}</span>
                <span style={{ flex: 1, color: 'var(--text-primary)', wordSpacing: '2px' }}>
                  {row.hex.slice(0, 8).join(' ')}  {row.hex.slice(8).join(' ')}
                </span>
                <span style={{ width: '130px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                  {row.ascii}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
