import React from 'react';
import { Image as ImageIcon, Camera, Sliders, Maximize2, AlertCircle } from 'lucide-react';
import { ImageMetadata } from '../../../shared/types';

interface ImageInspectorProps {
  image: ImageMetadata;
}

export const ImageInspector: React.FC<ImageInspectorProps> = ({ image }) => {
  return (
    <div className="peek-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="peek-card-header" style={{ marginBottom: 0 }}>
        <div className="card-title-group">
          <ImageIcon size={16} className="card-title-icon" />
          <h3 className="card-title">Image Technical Analysis</h3>
        </div>
        <span className="peek-badge badge-accent">Visual Matrix</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: image.previewUrl ? '280px 1fr' : '1fr', gap: '20px' }}>
        {/* Preview Container */}
        {image.previewUrl && (
          <div
            style={{
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              minHeight: '220px',
              position: 'relative',
            }}
          >
            <img
              src={image.previewUrl}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '260px',
                objectFit: 'contain',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
            {image.width > 0 && image.height > 0 && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-card)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                }}
              >
                {image.width} × {image.height} px
              </div>
            )}
          </div>
        )}

        {image.previewError && !image.previewUrl && (
          <div
            style={{
              padding: '12px',
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
            <AlertCircle size={15} style={{ color: 'var(--warning)' }} />
            <span>{image.previewError}</span>
          </div>
        )}

        {/* Technical Properties Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Dimensions</span>
              <div className="info-value">
                <span>{image.width > 0 && image.height > 0 ? `${image.width} × ${image.height} px` : 'Unspecified'}</span>
              </div>
            </div>

            <div className="info-item">
              <span className="info-label">Aspect Ratio</span>
              <div className="info-value">
                <span>{image.aspectRatio}</span>
              </div>
            </div>

            <div className="info-item">
              <span className="info-label">Color Space</span>
              <div className="info-value">
                <span>{image.colorSpace || 'Standard sRGB'}</span>
              </div>
            </div>

            <div className="info-item">
              <span className="info-label">Bit Depth</span>
              <div className="info-value">
                <span>{image.bitDepth ? `${image.bitDepth}-bit` : '8-bit per channel'}</span>
              </div>
            </div>

            {image.orientation !== undefined && (
              <div className="info-item">
                <span className="info-label">EXIF Orientation</span>
                <div className="info-value">
                  <span>{String(image.orientation)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Camera / Optics EXIF section */}
          {image.camera && (
            <div
              style={{
                marginTop: '4px',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Camera size={15} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Camera Optics & Capture Metadata
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '10px',
                }}
              >
                {(image.camera.make || image.camera.model) && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Camera</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {[image.camera.make, image.camera.model].filter(Boolean).join(' ')}
                    </span>
                  </div>
                )}

                {image.camera.lens && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Lens</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {image.camera.lens}
                    </span>
                  </div>
                )}

                {image.camera.focalLength && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Focal Length</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {image.camera.focalLength}
                    </span>
                  </div>
                )}

                {image.camera.fNumber && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Aperture</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {image.camera.fNumber}
                    </span>
                  </div>
                )}

                {image.camera.exposureTime && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Exposure Time</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {image.camera.exposureTime}
                    </span>
                  </div>
                )}

                {image.camera.iso && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ISO Speed</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {image.camera.iso}
                    </span>
                  </div>
                )}

                {image.camera.dateTimeOriginal && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Captured At</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {image.camera.dateTimeOriginal}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other EXIF fields */}
          {image.exif && Object.keys(image.exif).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(image.exif).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
