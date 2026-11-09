import React, { useState } from 'react';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import { FileInspectionResult } from '../../../shared/types';
import { FileOverviewCard } from './FileOverviewCard';
import { FormatMismatchAlert } from './FormatMismatchAlert';
import { GeneralInfoCard } from './GeneralInfoCard';
import { ImageInspector } from './ImageInspector';
import { VideoInspector } from './VideoInspector';
import { AudioInspector } from './AudioInspector';
import { PdfInspector } from './PdfInspector';
import { ArchiveInspector } from './ArchiveInspector';
import { HexViewer } from './HexViewer';
import { HashSection } from './HashSection';
import { UtilitiesBar } from './UtilitiesBar';

interface DashboardProps {
  result: FileInspectionResult;
  onBackToHome: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ result, onBackToHome }) => {
  const [isSummaryCopied, setIsSummaryCopied] = useState(false);

  const handleRevealInExplorer = () => {
    window.filePeekApi?.revealInExplorer(result.general.filePath);
  };

  const handleOpenFile = async () => {
    try {
      await window.filePeekApi?.openWithDefaultApp(result.general.filePath);
    } catch (err: any) {
      alert(`Could not open file: ${err.message}`);
    }
  };

  const handleCopySummary = () => {
    const summary = [
      `# FilePeek Inspection: ${result.general.fileName}`,
      `- **Path**: ${result.general.filePath}`,
      `- **Size**: ${result.general.sizeFormatted} (${result.general.sizeBytes} bytes)`,
      `- **Format**: ${result.general.detectedFormat} (${result.general.mimeType})`,
      `- **Extension**: ${result.general.fileExtension || '(none)'}`,
      `- **Signature Match**: ${result.verification.isMismatch ? 'MISMATCH DETECTED' : 'Verified'}`,
      result.verification.magicSignatureHex ? `- **Magic Bytes**: ${result.verification.magicSignatureHex}` : '',
      result.image ? `- **Image Dimensions**: ${result.image.width}x${result.image.height} (${result.image.aspectRatio})` : '',
      result.video ? `- **Video**: ${result.video.durationFormatted}, ${result.video.resolution}, ${result.video.videoCodec}` : '',
      result.audio ? `- **Audio**: ${result.audio.durationFormatted}, ${result.audio.codec}, ${result.audio.artist || ''} - ${result.audio.title || ''}` : '',
      result.pdf ? `- **PDF Pages**: ${result.pdf.pageCount}` : '',
      result.archive ? `- **Archive**: ${result.archive.totalFiles} files, ${result.archive.compressionRatioPercent}% compression` : '',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(summary);
    setIsSummaryCopied(true);
    setTimeout(() => setIsSummaryCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 28px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Back navigation row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          className="peek-btn peek-btn-secondary"
          onClick={onBackToHome}
          title="Inspect another file"
        >
          <ArrowLeft size={15} />
          <span>Inspect Another File</span>
        </button>

        <span className="peek-badge badge-neutral" style={{ fontSize: '11px' }}>
          Inspected at {new Date(result.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* 1. Hero Overview */}
      <FileOverviewCard
        result={result}
        onRevealInExplorer={handleRevealInExplorer}
        onOpenFile={handleOpenFile}
        onCopyAllSummary={handleCopySummary}
        isCopied={isSummaryCopied}
      />

      {/* 2. Format Verification & Mismatch Alert */}
      <FormatMismatchAlert verification={result.verification} />

      {/* 3. General Information */}
      <GeneralInfoCard general={result.general} />

      {/* 4. Specialized Category Inspector */}
      {result.category === 'image' && result.image && (
        <ImageInspector image={result.image} />
      )}

      {result.category === 'video' && result.video && (
        <VideoInspector video={result.video} />
      )}

      {result.category === 'audio' && result.audio && (
        <AudioInspector audio={result.audio} />
      )}

      {result.category === 'pdf' && result.pdf && (
        <PdfInspector pdf={result.pdf} />
      )}

      {result.category === 'archive' && result.archive && (
        <ArchiveInspector archive={result.archive} />
      )}

      {/* 5. Cryptographic Hashing */}
      <HashSection filePath={result.general.filePath} />

      {/* 6. Raw Binary Header / Hex Viewer */}
      <HexViewer fallback={result.fallback} initialExpanded={result.category === 'other' || result.category === 'executable'} />

      {/* 7. File Utilities & Report Export */}
      <UtilitiesBar
        result={result}
        onRevealInExplorer={handleRevealInExplorer}
        onOpenFile={handleOpenFile}
        onCopyAllSummary={handleCopySummary}
        isSummaryCopied={isSummaryCopied}
      />
    </div>
  );
};
