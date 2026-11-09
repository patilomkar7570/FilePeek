import React from 'react';
import { Video, Film, Clock, Disc, Mic } from 'lucide-react';
import { VideoMetadata } from '../../../shared/types';
import { formatBitrate, formatSampleRate } from '../../../shared/formatters';

interface VideoInspectorProps {
  video: VideoMetadata;
}

export const VideoInspector: React.FC<VideoInspectorProps> = ({ video }) => {
  return (
    <div className="peek-card">
      <div className="peek-card-header">
        <div className="card-title-group">
          <Video size={16} className="card-title-icon" />
          <h3 className="card-title">Video Stream & Container Metrics</h3>
        </div>
        <span className="peek-badge badge-accent">{video.containerFormat || 'Video Stream'}</span>
      </div>

      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Duration</span>
          <div className="info-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} style={{ color: 'var(--accent)' }} />
              <span>{video.durationFormatted}</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({video.durationSeconds}s)
            </span>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">Resolution</span>
          <div className="info-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Film size={14} style={{ color: 'var(--accent)' }} />
              <span>{video.resolution}</span>
            </div>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">Video Codec</span>
          <div className="info-value mono">
            <span>{video.videoCodec}</span>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">Container Format</span>
          <div className="info-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Disc size={14} style={{ color: 'var(--text-muted)' }} />
              <span>{video.containerFormat}</span>
            </div>
          </div>
        </div>

        <div className="info-item">
          <span className="info-label">Bitrate</span>
          <div className="info-value">
            <span>{formatBitrate(video.bitrateKbps)}</span>
          </div>
        </div>

        {video.frameRate && (
          <div className="info-item">
            <span className="info-label">Frame Rate</span>
            <div className="info-value">
              <span>{video.frameRate.toFixed(2)} fps</span>
            </div>
          </div>
        )}

        {video.audioCodec && (
          <div className="info-item">
            <span className="info-label">Audio Stream Codec</span>
            <div className="info-value mono">
              <span>{video.audioCodec}</span>
            </div>
          </div>
        )}

        {video.audioChannels && (
          <div className="info-item">
            <span className="info-label">Audio Channels</span>
            <div className="info-value">
              <span>{video.audioChannels === 1 ? 'Mono' : video.audioChannels === 2 ? 'Stereo (2.0)' : `${video.audioChannels} Channels`}</span>
            </div>
          </div>
        )}

        {video.audioSampleRate && (
          <div className="info-item">
            <span className="info-label">Audio Sample Rate</span>
            <div className="info-value">
              <span>{formatSampleRate(video.audioSampleRate)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
