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
  Layers,
} from 'lucide-react';
import { SUPPORTED_CATEGORIES } from '../../shared/constants';

export const SupportedFormats: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Image':
        return <FileImage size={20} style={{ color: '#28C76F' }} />;
      case 'Video':
        return <FileVideo size={20} style={{ color: '#FFA143' }} />;
      case 'Music':
        return <FileAudio size={20} style={{ color: '#E53E3E' }} />;
      case 'FileText':
        return <FileText size={20} style={{ color: '#FF5C5C' }} />;
      case 'Archive':
        return <FileArchive size={20} style={{ color: '#8B7CFF' }} />;
      case 'Cpu':
        return <Cpu size={20} style={{ color: '#38BDF8' }} />;
      case 'Code':
        return <FileCode size={20} style={{ color: '#A78BFA' }} />;
      default:
        return <FileQuestion size={20} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  return (
    <div className="peek-card" style={{ marginTop: '24px' }}>
      <div className="peek-card-header">
        <div className="card-title-group">
          <Layers size={16} className="card-title-icon" />
          <h3 className="card-title">Supported File Inspection Engines</h3>
        </div>
        <span className="peek-badge badge-accent">Full Local Analysis</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '12px',
        }}
      >
        {SUPPORTED_CATEGORIES.map((cat) => (
          <div
            key={cat.category}
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getIcon(cat.icon)}
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {cat.name}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {cat.description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
              {cat.extensions.slice(0, 5).map((ext) => (
                <span
                  key={ext}
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {ext}
                </span>
              ))}
              {cat.extensions.length > 5 && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    color: 'var(--text-muted)',
                  }}
                >
                  +{cat.extensions.length - 5} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
