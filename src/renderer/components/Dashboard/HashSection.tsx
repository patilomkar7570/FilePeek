import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Hash, Copy, Check, Loader2, Play, XCircle, AlertTriangle } from 'lucide-react';
import { HashProgressResult } from '../../../shared/types';

interface HashSectionProps {
  filePath: string;
}

export const HashSection: React.FC<HashSectionProps> = ({ filePath }) => {
  const [selectedAlgos, setSelectedAlgos] = useState<Record<'sha256' | 'sha1' | 'md5', boolean>>({
    sha256: true,
    sha1: false,
    md5: false,
  });

  const [hashes, setHashes] = useState<{
    sha256?: string;
    sha1?: string;
    md5?: string;
  }>({});

  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeRequestIdRef = useRef<string | null>(null);

  // Reset when filePath changes
  useEffect(() => {
    setHashes({});
    setIsCalculating(false);
    setProgress(0);
    setErrorMessage(null);
    activeRequestIdRef.current = null;
  }, [filePath]);

  const toggleAlgo = (algo: 'sha256' | 'sha1' | 'md5') => {
    if (isCalculating) return;
    setSelectedAlgos((prev) => ({
      ...prev,
      [algo]: !prev[algo],
    }));
  };

  const handleCalculate = async () => {
    const algosToCompute = (Object.keys(selectedAlgos) as Array<'sha256' | 'sha1' | 'md5'>).filter(
      (k) => selectedAlgos[k]
    );

    if (algosToCompute.length === 0) {
      setErrorMessage('Please select at least one hash algorithm.');
      return;
    }

    setErrorMessage(null);
    setIsCalculating(true);
    setProgress(0);

    const requestId = `hash_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    activeRequestIdRef.current = requestId;

    // Listen to streaming progress updates
    const unsubscribe = window.filePeekApi?.onHashProgress(requestId, (p) => {
      setProgress(p);
    });

    try {
      const result: HashProgressResult = await window.filePeekApi?.computeHash({
        filePath,
        algorithms: algosToCompute,
        requestId,
      });

      if (result.cancelled) {
        setIsCalculating(false);
        setProgress(0);
      } else {
        setHashes((prev) => ({
          ...prev,
          sha256: result.sha256 || prev.sha256,
          sha1: result.sha1 || prev.sha1,
          md5: result.md5 || prev.md5,
        }));
        setIsCalculating(false);
        setProgress(100);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to calculate file hashes.');
      setIsCalculating(false);
    } finally {
      if (unsubscribe) unsubscribe();
    }
  };

  const handleCancel = async () => {
    if (activeRequestIdRef.current && window.filePeekApi?.cancelHash) {
      await window.filePeekApi.cancelHash(activeRequestIdRef.current);
      setIsCalculating(false);
      setProgress(0);
    }
  };

  const handleCopyHash = (algo: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedAlgo(algo);
    setTimeout(() => setCopiedAlgo(null), 1500);
  };

  return (
    <div className="peek-card">
      <div className="peek-card-header">
        <div className="card-title-group">
          <Hash size={16} className="card-title-icon" />
          <h3 className="card-title">Cryptographic File Verification & Hashes</h3>
        </div>
        <span className="peek-badge badge-neutral">Memory-Streaming</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Controls & Algorithm Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Algorithms:
            </span>

            {/* SHA-256 (Default Recommended) */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                cursor: isCalculating ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--bg-input)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
              }}
            >
              <input
                type="checkbox"
                checked={selectedAlgos.sha256}
                onChange={() => toggleAlgo('sha256')}
                disabled={isCalculating}
              />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>SHA-256</span>
              <span className="peek-badge badge-accent" style={{ fontSize: '9px', padding: '1px 4px' }}>
                Recommended
              </span>
            </label>

            {/* SHA-1 (Legacy) */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                cursor: isCalculating ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--bg-input)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
              }}
            >
              <input
                type="checkbox"
                checked={selectedAlgos.sha1}
                onChange={() => toggleAlgo('sha1')}
                disabled={isCalculating}
              />
              <span style={{ color: 'var(--text-primary)' }}>SHA-1</span>
              <span className="peek-badge badge-warning" style={{ fontSize: '9px', padding: '1px 4px' }}>
                Legacy
              </span>
            </label>

            {/* MD5 (Legacy) */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                cursor: isCalculating ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--bg-input)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
              }}
            >
              <input
                type="checkbox"
                checked={selectedAlgos.md5}
                onChange={() => toggleAlgo('md5')}
                disabled={isCalculating}
              />
              <span style={{ color: 'var(--text-primary)' }}>MD5</span>
              <span className="peek-badge badge-warning" style={{ fontSize: '9px', padding: '1px 4px' }}>
                Legacy
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isCalculating ? (
              <button className="peek-btn peek-btn-danger" onClick={handleCancel}>
                <XCircle size={14} />
                <span>Cancel</span>
              </button>
            ) : (
              <button className="peek-btn peek-btn-primary" onClick={handleCalculate}>
                <Play size={14} />
                <span>Calculate Hashes</span>
              </button>
            )}
          </div>
        </div>

        {/* Calculation Progress Bar */}
        {isCalculating && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>Streaming file chunks...</span>
              <span>{progress}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                backgroundColor: 'var(--bg-input)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: 'var(--accent)',
                  transition: 'width 100ms linear',
                }}
              />
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--danger-subtle)',
              border: '1px solid rgba(255, 92, 92, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--danger)',
            }}
          >
            <AlertTriangle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Hashes Display Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* SHA-256 */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  SHA-256
                </span>
                <span className="peek-badge badge-accent" style={{ fontSize: '9px', padding: '1px 5px' }}>
                  Standard Secure
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: hashes.sha256 ? 'var(--text-primary)' : 'var(--text-muted)',
                  wordBreak: 'break-all',
                }}
              >
                {hashes.sha256 || 'Click "Calculate Hashes" to generate digest'}
              </span>
            </div>

            {hashes.sha256 && (
              <button
                className="peek-btn peek-btn-secondary"
                onClick={() => handleCopyHash('sha256', hashes.sha256!)}
                title="Copy SHA-256 hash"
                style={{ padding: '6px 10px', fontSize: '11px' }}
              >
                {copiedAlgo === 'sha256' ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                <span>{copiedAlgo === 'sha256' ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {/* SHA-1 */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  SHA-1
                </span>
                <span className="peek-badge badge-warning" style={{ fontSize: '9px', padding: '1px 5px' }}>
                  Legacy (Collision Prone)
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: hashes.sha1 ? 'var(--text-primary)' : 'var(--text-muted)',
                  wordBreak: 'break-all',
                }}
              >
                {hashes.sha1 || 'Click "Calculate Hashes" to generate digest'}
              </span>
            </div>

            {hashes.sha1 && (
              <button
                className="peek-btn peek-btn-secondary"
                onClick={() => handleCopyHash('sha1', hashes.sha1!)}
                title="Copy SHA-1 hash"
                style={{ padding: '6px 10px', fontSize: '11px' }}
              >
                {copiedAlgo === 'sha1' ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                <span>{copiedAlgo === 'sha1' ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {/* MD5 */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  MD5
                </span>
                <span className="peek-badge badge-warning" style={{ fontSize: '9px', padding: '1px 5px' }}>
                  Legacy (Checksum Only)
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: hashes.md5 ? 'var(--text-primary)' : 'var(--text-muted)',
                  wordBreak: 'break-all',
                }}
              >
                {hashes.md5 || 'Click "Calculate Hashes" to generate digest'}
              </span>
            </div>

            {hashes.md5 && (
              <button
                className="peek-btn peek-btn-secondary"
                onClick={() => handleCopyHash('md5', hashes.md5!)}
                title="Copy MD5 hash"
                style={{ padding: '6px 10px', fontSize: '11px' }}
              >
                {copiedAlgo === 'md5' ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                <span>{copiedAlgo === 'md5' ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
