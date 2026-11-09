import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { FormatVerification } from '../../../shared/types';

interface FormatMismatchAlertProps {
  verification: FormatVerification;
}

export const FormatMismatchAlert: React.FC<FormatMismatchAlertProps> = ({ verification }) => {
  const { isMismatch, isUnknownFormat, warningMessage, detectedFormat, extension, magicSignatureHex, magicSignatureAscii } = verification;

  if (isMismatch) {
    return (
      <div
        className="peek-card"
        style={{
          border: '1px solid rgba(255, 161, 67, 0.4)',
          backgroundColor: 'var(--warning-subtle)',
          boxShadow: '0 4px 16px rgba(255, 161, 67, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 161, 67, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--warning)',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--warning)' }}>
                File extension does not match detected format.
              </span>
              <span className="peek-badge badge-warning">Signature Mismatch</span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              The file extension is <strong>{extension}</strong>, but signature analysis detected <strong>{detectedFormat}</strong>.
            </p>

            {magicSignatureHex && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  backgroundColor: 'var(--bg-card)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  width: 'fit-content',
                  marginTop: '4px',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Header Signature:</span>
                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{magicSignatureHex}</span>
                {magicSignatureAscii && <span style={{ color: 'var(--text-secondary)' }}>({magicSignatureAscii})</span>}
              </div>
            )}

            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
              Note: A format mismatch indicates irregular file naming. FilePeek does not declare any file safe or harmful based on format inspection alone.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isUnknownFormat) {
    return (
      <div
        className="peek-card"
        style={{
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-input)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <HelpCircle size={20} style={{ color: 'var(--text-muted)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Format signature unrecognized
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Magic bytes do not match known specification databases. Inspected as generic binary container.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="peek-card"
      style={{
        border: '1px solid rgba(40, 199, 111, 0.25)',
        backgroundColor: 'var(--success-subtle)',
        padding: '12px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Format Signature Verified: Consistent with {detectedFormat}
          </span>
        </div>
        {magicSignatureHex && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-card)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
            }}
          >
            Magic: {magicSignatureHex.substring(0, 16)}
          </div>
        )}
      </div>
    </div>
  );
};
