import React from 'react';
import { Music, Clock, Disc, Mic, Radio, User, FolderMusic, Tag } from 'lucide-react';
import { AudioMetadata } from '../../../shared/types';
import { formatBitrate, formatSampleRate } from '../../../shared/formatters';

interface AudioInspectorProps {
  audio: AudioMetadata;
}

export const AudioInspector: React.FC<AudioInspectorProps> = ({ audio }) => {
  return (
    <div className="peek-card">
      <div className="peek-card-header">
        <div className="card-title-group">
          <Music size={16} className="card-title-icon" />
          <h3 className="card-title">Audio Stream & ID3 Metadata</h3>
        </div>
        <span className="peek-badge badge-accent">{audio.codec}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: audio.coverArtUrl ? '160px 1fr' : '1fr', gap: '20px' }}>
        {audio.coverArtUrl && (
          <div
            style={{
              width: '160px',
              height: '160px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <img
              src={audio.coverArtUrl}
              alt="Album Art"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Duration</span>
              <div className="info-value">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} style={{ color: 'var(--accent)' }} />
                  <span>{audio.durationFormatted}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  ({audio.durationSeconds}s)
                </span>
              </div>
            </div>

            <div className="info-item">
              <span className="info-label">Codec / Encoding</span>
              <div className="info-value mono">
                <span>{audio.codec}</span>
              </div>
            </div>

            <div className="info-item">
              <span className="info-label">Bitrate</span>
              <div className="info-value">
                <span>{formatBitrate(audio.bitrateKbps)}</span>
              </div>
            </div>

            <div className="info-item">
              <span className="info-label">Sample Rate</span>
              <div className="info-value">
                <span>{formatSampleRate(audio.sampleRateHz)}</span>
              </div>
            </div>

            <div className="info-item">
              <span className="info-label">Channels & Layout</span>
              <div className="info-value">
                <span>{audio.channelLayout || (audio.channels ? `${audio.channels} channels` : 'Unknown')}</span>
              </div>
            </div>
          </div>

          {/* ID3 / Vorbis Tags */}
          {(audio.title || audio.artist || audio.album || audio.year || audio.genre) && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Embedded Tags & Release Information
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '8px',
                }}
              >
                {audio.title && (
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Title</span>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{audio.title}</p>
                  </div>
                )}

                {audio.artist && (
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Artist</span>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{audio.artist}</p>
                  </div>
                )}

                {audio.album && (
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Album</span>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{audio.album}</p>
                  </div>
                )}

                {audio.genre && (
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Genre</span>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{audio.genre}</p>
                  </div>
                )}

                {audio.year && (
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Year</span>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{audio.year}</p>
                  </div>
                )}

                {audio.trackNo && (
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Track</span>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>#{audio.trackNo}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
