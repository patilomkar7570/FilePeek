import React, { useState, useMemo } from 'react';
import { Archive, Folder, File, Lock, Search, Percent, HardDrive } from 'lucide-react';
import { ArchiveMetadata } from '../../../shared/types';
import { formatBytes, formatExactBytes } from '../../../shared/formatters';

interface ArchiveInspectorProps {
  archive: ArchiveMetadata;
}

export const ArchiveInspector: React.FC<ArchiveInspectorProps> = ({ archive }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return archive.entries;
    const term = searchTerm.toLowerCase();
    return archive.entries.filter((entry) => entry.path.toLowerCase().includes(term));
  }, [archive.entries, searchTerm]);

  return (
    <div className="peek-card">
      <div className="peek-card-header">
        <div className="card-title-group">
          <Archive size={16} className="card-title-icon" />
          <h3 className="card-title">Archive Central Directory Inspection</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {archive.isEncrypted && (
            <span className="peek-badge badge-warning">
              <Lock size={11} />
              <span>Encrypted Entries</span>
            </span>
          )}
          <span className="peek-badge badge-accent">{archive.format}</span>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Contained Files</span>
          <div className="info-value">
            <span>{archive.totalFiles} files</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({archive.totalDirs} directories)
            </span>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">Uncompressed Size</span>
          <div className="info-value">
            <span>{formatBytes(archive.totalUncompressedSizeBytes)}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({formatExactBytes(archive.totalUncompressedSizeBytes)})
            </span>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">Compressed Size</span>
          <div className="info-value">
            <span>{formatBytes(archive.totalCompressedSizeBytes)}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({formatExactBytes(archive.totalCompressedSizeBytes)})
            </span>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">Compression Ratio</span>
          <div className="info-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Percent size={14} style={{ color: 'var(--success)' }} />
              <span style={{ color: 'var(--success)' }}>
                {archive.compressionRatioPercent}% reduction
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Internal File Structure */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Contained Files & Directory Structure ({archive.entries.length} items)
          </span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-input)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Search size={13} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter archive paths..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12px',
                width: '180px',
              }}
            />
          </div>
        </div>

        <div
          style={{
            maxHeight: '260px',
            overflowY: 'auto',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-input)',
          }}
        >
          {filteredEntries.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              No matching files found inside this archive.
            </div>
          ) : (
            filteredEntries.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  borderBottom: idx < filteredEntries.length - 1 ? '1px solid var(--border-color)' : 'none',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  {entry.isDirectory ? (
                    <Folder size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  ) : (
                    <File size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  )}
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: entry.isDirectory ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: entry.isDirectory ? 600 : 400,
                    }}
                    title={entry.path}
                  >
                    {entry.path}
                  </span>
                </div>

                {!entry.isDirectory && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '12px' }}>
                    {entry.isEncrypted && (
                      <span className="peek-badge badge-warning" style={{ fontSize: '9px', padding: '1px 4px' }}>
                        Encrypted
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {formatBytes(entry.uncompressedSize)}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {archive.truncatedNotice && (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
            {archive.truncatedNotice}
          </p>
        )}
      </div>
    </div>
  );
};
