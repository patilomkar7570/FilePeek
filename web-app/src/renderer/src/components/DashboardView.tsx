import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  RefreshCwIcon,
  CopyIcon,
  DownloadIcon,
  FolderOpenIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  CheckIcon,
  FileIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  PdfIcon,
  ArchiveIcon,
  CodeIcon,
  HashIcon,
  InfoIcon,
} from './Icons';
import {
  FileInspectionResult,
  FileCategory,
  HashProgressUpdate,
} from '../../../shared/types';
import {
  generateTextReport,
  generateJsonReport,
  generateSummaryClipboardText,
} from '../../../extractors/reporter';

interface DashboardViewProps {
  inspection: FileInspectionResult;
  onBack: () => void;
  onReinspect: () => void;
  onShowToast: (message: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  inspection,
  onBack,
  onReinspect,
  onShowToast,
}) => {
  const { general, format, technical, hashes } = inspection;

  // Hashing states
  const [currentHashes, setCurrentHashes] = useState(hashes);
  const [isHashing, setIsHashing] = useState(false);
  const [hashProgress, setHashProgress] = useState<HashProgressUpdate | null>(null);

  // Archive entry search
  const [archiveSearch, setArchiveSearch] = useState('');

  const getCategoryIcon = (category: FileCategory, size: number = 24) => {
    switch (category) {
      case 'image': return <ImageIcon size={size} />;
      case 'video': return <VideoIcon size={size} />;
      case 'audio': return <MusicIcon size={size} />;
      case 'pdf': return <PdfIcon size={size} />;
      case 'archive': return <ArchiveIcon size={size} />;
      case 'code': return <CodeIcon size={size} />;
      default: return <FileIcon size={size} />;
    }
  };

  // Clipboard copy helpers
  const copyText = async (text: string, label: string) => {
    try {
      if ((window as any).filePeekApi?.copyToClipboard) {
        await (window as any).filePeekApi.copyToClipboard(text);
      } else {
        await navigator.clipboard.writeText(text);
      }
      onShowToast(`Copied ${label} to clipboard`);
    } catch {
      onShowToast(`Failed to copy ${label}`);
    }
  };

  // Run Hashing
  const handleCalculateAllHashes = async () => {
    if (isHashing) return;
    setIsHashing(true);
    setHashProgress(null);

    try {
      if ((window as any).filePeekApi?.calculateHashes) {
        const results = await (window as any).filePeekApi.calculateHashes(
          general.filePath,
          ['sha256', 'sha1', 'md5'],
          (progress: HashProgressUpdate) => {
            setHashProgress(progress);
          }
        );
        setCurrentHashes(results);
        onShowToast('Calculated SHA-256, SHA-1, and MD5 hashes');
      }
    } catch (err: any) {
      onShowToast(`Hashing error: ${err.message || 'Operation failed'}`);
    } finally {
      setIsHashing(false);
      setHashProgress(null);
    }
  };

  const handleCancelHash = async () => {
    if ((window as any).filePeekApi?.cancelHashCalculation) {
      await (window as any).filePeekApi.cancelHashCalculation();
      setIsHashing(false);
      setHashProgress(null);
      onShowToast('Hash calculation cancelled');
    }
  };

  // Utilities actions
  const handleRevealInExplorer = async () => {
    if ((window as any).filePeekApi?.revealInExplorer) {
      const ok = await (window as any).filePeekApi.revealInExplorer(general.filePath);
      if (ok) {
        onShowToast('Revealed file in File Explorer');
      } else {
        onShowToast('Could not reveal file in explorer');
      }
    }
  };

  const handleOpenDefaultApp = async () => {
    if (window.confirm(`Open "${general.fileName}" with its default Windows application?`)) {
      if ((window as any).filePeekApi?.openFileWithDefaultApp) {
        const ok = await (window as any).filePeekApi.openFileWithDefaultApp(general.filePath);
        if (ok) {
          onShowToast('Opened file with default program');
        } else {
          onShowToast('Failed to open file with default program');
        }
      }
    }
  };

  const handleExportReport = async (formatType: 'txt' | 'json') => {
    const content = formatType === 'json'
      ? generateJsonReport(inspection)
      : generateTextReport(inspection);

    const defaultName = `${general.fileName}_FilePeek_Report.${formatType}`;

    if ((window as any).filePeekApi?.exportReport) {
      const res = await (window as any).filePeekApi.exportReport(formatType, defaultName, content);
      if (res.success && res.filePath) {
        onShowToast(`Report exported to ${res.filePath}`);
      } else if (!res.cancelled) {
        onShowToast('Failed to export report');
      }
    } else {
      // Browser fallback
      const blob = new Blob([content], { type: formatType === 'json' ? 'application/json' : 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultName;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast(`Downloaded ${defaultName}`);
    }
  };

  const filteredArchiveEntries = technical.archive?.entries.filter((entry) =>
    entry.path.toLowerCase().includes(archiveSearch.toLowerCase())
  );

  return (
    <div className="dashboard-view">
      {/* Top Bar Navigation */}
      <div className="dashboard-topbar">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeftIcon size={16} />
          <span>Inspect Another File</span>
        </button>

        <div className="topbar-actions">
          <button className="btn-back" onClick={onReinspect} title="Re-inspect file">
            <RefreshCwIcon size={15} />
            <span>Re-inspect</span>
          </button>
          <button
            className="btn-back"
            onClick={() => copyText(generateSummaryClipboardText(inspection), 'Summary')}
            title="Copy file summary"
          >
            <CopyIcon size={15} />
            <span>Copy Summary</span>
          </button>
          <button
            className="btn-back"
            onClick={() => handleExportReport('txt')}
            title="Export TXT report"
          >
            <DownloadIcon size={15} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Overview Header Card */}
      <div className="overview-card">
        <div className="overview-icon-container">
          {getCategoryIcon(format.category, 30)}
        </div>
        <div className="overview-details">
          <div className="overview-filename">{general.fileName}</div>
          <div
            className="overview-filepath"
            onClick={() => copyText(general.filePath, 'File Path')}
            title="Click to copy file location"
          >
            {general.filePath}
          </div>
          <div className="overview-badges">
            <span className="badge badge-primary">{format.detectedFormat}</span>
            <span className="badge">{general.fileSizeFormatted}</span>
            <span className="badge">{format.detectedMime}</span>
            <span className="badge">Conf: {format.confidence.toUpperCase()}</span>
            {format.magicBytesHex && (
              <span className="badge" title={`Hex: ${format.magicBytesHex} | Ascii: ${format.magicBytesAscii}`}>
                Magic: {format.magicBytesHex.slice(0, 11)}...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Extension Mismatch Warning */}
      {format.isExtensionMismatch && (
        <div className="mismatch-banner">
          <AlertTriangleIcon size={22} />
          <div>
            <div className="mismatch-title">File Extension Mismatch Detected</div>
            <div className="mismatch-desc">
              {format.mismatchWarning || 'The file extension does not match the actual detected format based on file signatures.'}
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="info-section-grid">
        {/* Card 1: General Information */}
        <div className="dashboard-card">
          <div className="card-heading">
            <span className="card-title">
              <FileIcon size={17} />
              <span>General Information</span>
            </span>
          </div>

          <div className="prop-table">
            <div className="prop-row">
              <span className="prop-key">File Name</span>
              <span className="prop-val">{general.fileName}</span>
            </div>
            <div className="prop-row">
              <span className="prop-key">File Extension</span>
              <span className="prop-val">{general.fileExtension || '(none)'}</span>
            </div>
            <div className="prop-row">
              <span className="prop-key">Detected Format</span>
              <span className="prop-val">{format.detectedFormat}</span>
            </div>
            <div className="prop-row">
              <span className="prop-key">MIME Type</span>
              <span className="prop-val mono">{format.detectedMime}</span>
            </div>
            <div className="prop-row">
              <span className="prop-key">File Size</span>
              <span className="prop-val">
                {general.fileSizeFormatted} ({general.fileSizeBytes.toLocaleString()} bytes)
              </span>
            </div>
            <div className="prop-row">
              <span className="prop-key">Created</span>
              <span className="prop-val">{general.creationTimeFormatted}</span>
            </div>
            <div className="prop-row">
              <span className="prop-key">Last Modified</span>
              <span className="prop-val">{general.lastModifiedTimeFormatted}</span>
            </div>
            <div className="prop-row">
              <span className="prop-key">Last Accessed</span>
              <span className="prop-val">{general.lastAccessedTimeFormatted}</span>
            </div>
            <div className="prop-row">
              <span className="prop-key">Access Permissions</span>
              <span className="prop-val">
                {general.isReadOnly ? 'Read-Only' : 'Read/Write'}
                {general.isHidden ? ' • Hidden' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Technical Details (Category-Specific) */}
        <div className="dashboard-card">
          <div className="card-heading">
            <span className="card-title">
              {getCategoryIcon(format.category, 17)}
              <span>Technical Details ({format.category.toUpperCase()})</span>
            </span>
          </div>

          {/* Image Category */}
          {technical.image && (
            <div>
              {technical.image.previewAvailable && technical.image.previewUrl && (
                <div className="image-preview-wrapper">
                  <img
                    src={technical.image.previewUrl}
                    alt={general.fileName}
                    className="image-preview-element"
                  />
                </div>
              )}
              {technical.image.previewNote && (
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {technical.image.previewNote}
                </div>
              )}

              <div className="prop-table">
                <div className="prop-row">
                  <span className="prop-key">Dimensions</span>
                  <span className="prop-val">
                    {technical.image.width} × {technical.image.height} px
                  </span>
                </div>
                <div className="prop-row">
                  <span className="prop-key">Aspect Ratio</span>
                  <span className="prop-val">{technical.image.aspectRatio}</span>
                </div>
                {technical.image.colorSpace && (
                  <div className="prop-row">
                    <span className="prop-key">Color Space</span>
                    <span className="prop-val">{technical.image.colorSpace}</span>
                  </div>
                )}
                {technical.image.bitDepth && (
                  <div className="prop-row">
                    <span className="prop-key">Bit Depth</span>
                    <span className="prop-val">{technical.image.bitDepth}-bit</span>
                  </div>
                )}
                {technical.image.hasAlpha !== undefined && (
                  <div className="prop-row">
                    <span className="prop-key">Alpha Channel</span>
                    <span className="prop-val">{technical.image.hasAlpha ? 'Yes' : 'No'}</span>
                  </div>
                )}
                {technical.image.cameraMake && (
                  <div className="prop-row">
                    <span className="prop-key">Camera Make</span>
                    <span className="prop-val">{technical.image.cameraMake}</span>
                  </div>
                )}
                {technical.image.cameraModel && (
                  <div className="prop-row">
                    <span className="prop-key">Camera Model</span>
                    <span className="prop-val">{technical.image.cameraModel}</span>
                  </div>
                )}
                {technical.image.lensModel && (
                  <div className="prop-row">
                    <span className="prop-key">Lens</span>
                    <span className="prop-val">{technical.image.lensModel}</span>
                  </div>
                )}
                {technical.image.dateTimeOriginal && (
                  <div className="prop-row">
                    <span className="prop-key">Date Taken</span>
                    <span className="prop-val">{technical.image.dateTimeOriginal}</span>
                  </div>
                )}
                {technical.image.fNumber && (
                  <div className="prop-row">
                    <span className="prop-key">Aperture</span>
                    <span className="prop-val">f/{technical.image.fNumber}</span>
                  </div>
                )}
                {technical.image.exposureTime && (
                  <div className="prop-row">
                    <span className="prop-key">Exposure Time</span>
                    <span className="prop-val">{technical.image.exposureTime}</span>
                  </div>
                )}
                {technical.image.iso && (
                  <div className="prop-row">
                    <span className="prop-key">ISO Speed</span>
                    <span className="prop-val">{technical.image.iso}</span>
                  </div>
                )}
                {technical.image.focalLength && (
                  <div className="prop-row">
                    <span className="prop-key">Focal Length</span>
                    <span className="prop-val">{technical.image.focalLength}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Video Category */}
          {technical.video && (
            <div className="prop-table">
              <div className="prop-row">
                <span className="prop-key">Duration</span>
                <span className="prop-val">{technical.video.durationFormatted}</span>
              </div>
              {technical.video.resolution && (
                <div className="prop-row">
                  <span className="prop-key">Resolution</span>
                  <span className="prop-val">{technical.video.resolution}</span>
                </div>
              )}
              {technical.video.aspectRatio && (
                <div className="prop-row">
                  <span className="prop-key">Aspect Ratio</span>
                  <span className="prop-val">{technical.video.aspectRatio}</span>
                </div>
              )}
              {technical.video.videoCodec && (
                <div className="prop-row">
                  <span className="prop-key">Video Codec</span>
                  <span className="prop-val">{technical.video.videoCodec}</span>
                </div>
              )}
              {technical.video.audioCodec && (
                <div className="prop-row">
                  <span className="prop-key">Audio Codec</span>
                  <span className="prop-val">{technical.video.audioCodec}</span>
                </div>
              )}
              {technical.video.frameRateFormatted && (
                <div className="prop-row">
                  <span className="prop-key">Frame Rate</span>
                  <span className="prop-val">{technical.video.frameRateFormatted}</span>
                </div>
              )}
              {technical.video.bitrateFormatted && (
                <div className="prop-row">
                  <span className="prop-key">Bitrate</span>
                  <span className="prop-val">{technical.video.bitrateFormatted}</span>
                </div>
              )}
              <div className="prop-row">
                <span className="prop-key">Container Format</span>
                <span className="prop-val">{technical.video.containerFormat}</span>
              </div>
            </div>
          )}

          {/* Audio Category */}
          {technical.audio && (
            <div className="prop-table">
              <div className="prop-row">
                <span className="prop-key">Duration</span>
                <span className="prop-val">{technical.audio.durationFormatted}</span>
              </div>
              <div className="prop-row">
                <span className="prop-key">Codec</span>
                <span className="prop-val">{technical.audio.codec}</span>
              </div>
              {technical.audio.title && (
                <div className="prop-row">
                  <span className="prop-key">Title</span>
                  <span className="prop-val">{technical.audio.title}</span>
                </div>
              )}
              {technical.audio.artist && (
                <div className="prop-row">
                  <span className="prop-key">Artist</span>
                  <span className="prop-val">{technical.audio.artist}</span>
                </div>
              )}
              {technical.audio.album && (
                <div className="prop-row">
                  <span className="prop-key">Album</span>
                  <span className="prop-val">{technical.audio.album}</span>
                </div>
              )}
              {technical.audio.year && (
                <div className="prop-row">
                  <span className="prop-key">Year</span>
                  <span className="prop-val">{technical.audio.year}</span>
                </div>
              )}
              {technical.audio.genre && (
                <div className="prop-row">
                  <span className="prop-key">Genre</span>
                  <span className="prop-val">{technical.audio.genre}</span>
                </div>
              )}
              {technical.audio.bitrateFormatted && (
                <div className="prop-row">
                  <span className="prop-key">Bitrate</span>
                  <span className="prop-val">{technical.audio.bitrateFormatted}</span>
                </div>
              )}
              {technical.audio.sampleRateHz && (
                <div className="prop-row">
                  <span className="prop-key">Sample Rate</span>
                  <span className="prop-val">{technical.audio.sampleRateHz.toLocaleString()} Hz</span>
                </div>
              )}
              {technical.audio.channelsFormatted && (
                <div className="prop-row">
                  <span className="prop-key">Channels</span>
                  <span className="prop-val">{technical.audio.channelsFormatted}</span>
                </div>
              )}
            </div>
          )}

          {/* PDF Category */}
          {technical.pdf && (
            <div className="prop-table">
              <div className="prop-row">
                <span className="prop-key">PDF Version</span>
                <span className="prop-val">{technical.pdf.pdfVersion}</span>
              </div>
              <div className="prop-row">
                <span className="prop-key">Page Count</span>
                <span className="prop-val">{technical.pdf.pageCount} Pages</span>
              </div>
              {technical.pdf.title && (
                <div className="prop-row">
                  <span className="prop-key">Document Title</span>
                  <span className="prop-val">{technical.pdf.title}</span>
                </div>
              )}
              {technical.pdf.author && (
                <div className="prop-row">
                  <span className="prop-key">Author</span>
                  <span className="prop-val">{technical.pdf.author}</span>
                </div>
              )}
              {technical.pdf.subject && (
                <div className="prop-row">
                  <span className="prop-key">Subject</span>
                  <span className="prop-val">{technical.pdf.subject}</span>
                </div>
              )}
              {technical.pdf.creator && (
                <div className="prop-row">
                  <span className="prop-key">Creator</span>
                  <span className="prop-val">{technical.pdf.creator}</span>
                </div>
              )}
              {technical.pdf.producer && (
                <div className="prop-row">
                  <span className="prop-key">Producer</span>
                  <span className="prop-val">{technical.pdf.producer}</span>
                </div>
              )}
              {technical.pdf.creationDate && (
                <div className="prop-row">
                  <span className="prop-key">Creation Date</span>
                  <span className="prop-val">{technical.pdf.creationDate}</span>
                </div>
              )}
              <div className="prop-row">
                <span className="prop-key">Encrypted</span>
                <span className="prop-val">{technical.pdf.isEncrypted ? 'Yes' : 'No'}</span>
              </div>
            </div>
          )}

          {/* Archive Category */}
          {technical.archive && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="prop-table">
                <div className="prop-row">
                  <span className="prop-key">Archive Format</span>
                  <span className="prop-val">{technical.archive.archiveFormat}</span>
                </div>
                <div className="prop-row">
                  <span className="prop-key">Total Files</span>
                  <span className="prop-val">{technical.archive.fileCount.toLocaleString()}</span>
                </div>
                <div className="prop-row">
                  <span className="prop-key">Uncompressed Size</span>
                  <span className="prop-val">{technical.archive.totalUncompressedSizeFormatted}</span>
                </div>
                <div className="prop-row">
                  <span className="prop-key">Compressed Size</span>
                  <span className="prop-val">{technical.archive.totalCompressedSizeFormatted}</span>
                </div>
                <div className="prop-row">
                  <span className="prop-key">Compression Ratio</span>
                  <span className="prop-val">{technical.archive.compressionRatio}%</span>
                </div>
              </div>

              {technical.archive.entries.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Contained Files ({technical.archive.entries.length})
                    </span>
                    <input
                      type="text"
                      placeholder="Filter files..."
                      value={archiveSearch}
                      onChange={(e) => setArchiveSearch(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        borderRadius: 'var(--radius-sm)',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div className="archive-table-container">
                    <table className="archive-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Size</th>
                          <th>Modified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredArchiveEntries?.slice(0, 100).map((entry, idx) => (
                          <tr key={idx}>
                            <td title={entry.path}>
                              {entry.isDirectory ? '📁 ' : '📄 '}
                              {entry.name}
                            </td>
                            <td>{entry.isDirectory ? '-' : `${(entry.uncompressedSize / 1024).toFixed(1)} KB`}</td>
                            <td>{entry.lastModified}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback for other categories */}
          {!technical.image && !technical.video && !technical.audio && !technical.pdf && !technical.archive && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '12px 0' }}>
              <p>{technical.notes || 'Detailed metadata is unavailable for this file type.'}</p>
              <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                FilePeek identified this file via magic-byte signatures and header analysis.
              </p>
            </div>
          )}
        </div>

        {/* Card 3: File Verification (Hashing) */}
        <div className="dashboard-card">
          <div className="card-heading">
            <span className="card-title">
              <HashIcon size={17} />
              <span>File Verification & Hashes</span>
            </span>
            {!isHashing ? (
              <button
                className="btn-ghost-sm"
                onClick={handleCalculateAllHashes}
                title="Compute SHA-256, SHA-1, and MD5"
              >
                Compute All Hashes
              </button>
            ) : (
              <button
                className="btn-ghost-sm"
                onClick={handleCancelHash}
                style={{ color: 'var(--danger-text)' }}
              >
                Cancel
              </button>
            )}
          </div>

          {isHashing && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                <span>Hashing in progress...</span>
                <span>{hashProgress ? `${hashProgress.percentage}%` : 'Reading stream...'}</span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${hashProgress?.percentage || 5}%` }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* SHA-256 */}
            <div className="hash-row">
              <div className="hash-row-header">
                <span className="hash-name">SHA-256 (Recommended Standard)</span>
              </div>
              <div className="hash-value-box">
                <span className="hash-hex">
                  {currentHashes?.sha256?.hash || 'Not yet calculated'}
                </span>
                {currentHashes?.sha256?.hash && (
                  <button
                    className="btn-copy-hash"
                    onClick={() => copyText(currentHashes.sha256!.hash, 'SHA-256')}
                    title="Copy SHA-256"
                  >
                    <CopyIcon size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* SHA-1 */}
            <div className="hash-row">
              <div className="hash-row-header">
                <span className="hash-name">SHA-1</span>
                <span className="hash-legacy-tag">Legacy / Insecure</span>
              </div>
              <div className="hash-value-box">
                <span className="hash-hex">
                  {currentHashes?.sha1?.hash || 'Click "Compute All Hashes"'}
                </span>
                {currentHashes?.sha1?.hash && (
                  <button
                    className="btn-copy-hash"
                    onClick={() => copyText(currentHashes.sha1!.hash, 'SHA-1')}
                    title="Copy SHA-1"
                  >
                    <CopyIcon size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* MD5 */}
            <div className="hash-row">
              <div className="hash-row-header">
                <span className="hash-name">MD5</span>
                <span className="hash-legacy-tag">Legacy / Insecure</span>
              </div>
              <div className="hash-value-box">
                <span className="hash-hex">
                  {currentHashes?.md5?.hash || 'Click "Compute All Hashes"'}
                </span>
                {currentHashes?.md5?.hash && (
                  <button
                    className="btn-copy-hash"
                    onClick={() => copyText(currentHashes.md5!.hash, 'MD5')}
                    title="Copy MD5"
                  >
                    <CopyIcon size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Utilities */}
        <div className="dashboard-card">
          <div className="card-heading">
            <span className="card-title">
              <FolderOpenIcon size={17} />
              <span>Actions & Utilities</span>
            </span>
          </div>

          <div className="utility-actions-grid">
            <button className="utility-btn" onClick={handleRevealInExplorer}>
              <FolderOpenIcon size={16} />
              <span>Reveal in Explorer</span>
            </button>

            <button className="utility-btn" onClick={handleOpenDefaultApp}>
              <ExternalLinkIcon size={16} />
              <span>Open File</span>
            </button>

            <button className="utility-btn" onClick={() => copyText(general.fileName, 'File Name')}>
              <CopyIcon size={16} />
              <span>Copy File Name</span>
            </button>

            <button className="utility-btn" onClick={() => copyText(general.filePath, 'File Location')}>
              <CopyIcon size={16} />
              <span>Copy Full Path</span>
            </button>

            <button className="utility-btn" onClick={() => handleExportReport('txt')}>
              <DownloadIcon size={16} />
              <span>Export TXT Report</span>
            </button>

            <button className="utility-btn" onClick={() => handleExportReport('json')}>
              <DownloadIcon size={16} />
              <span>Export JSON Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
