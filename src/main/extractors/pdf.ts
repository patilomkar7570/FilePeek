import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { PdfMetadata } from '../../shared/types';
import { formatDate } from '../../shared/formatters';

export async function extractPdfMetadata(filePath: string): Promise<PdfMetadata> {
  const result: PdfMetadata = {
    pageCount: 0,
  };

  try {
    const fileBuf = await fs.promises.readFile(filePath);

    // Extract PDF version from header (e.g. %PDF-1.7)
    const headerStr = fileBuf.subarray(0, 32).toString('ascii');
    const versionMatch = headerStr.match(/%PDF-(\d+\.\d+)/);
    if (versionMatch) {
      result.pdfVersion = `PDF ${versionMatch[1]}`;
    }

    // Load PDF document
    const pdfDoc = await PDFDocument.load(fileBuf, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    result.pageCount = pdfDoc.getPageCount();
    result.title = pdfDoc.getTitle() || undefined;
    result.author = pdfDoc.getAuthor() || undefined;
    result.subject = pdfDoc.getSubject() || undefined;
    result.creator = pdfDoc.getCreator() || undefined;
    result.producer = pdfDoc.getProducer() || undefined;

    const creationDate = pdfDoc.getCreationDate();
    if (creationDate) {
      result.creationDate = formatDate(creationDate);
    }

    const modDate = pdfDoc.getModificationDate();
    if (modDate) {
      result.modificationDate = formatDate(modDate);
    }
  } catch (err: any) {
    if (err && err.message && err.message.toLowerCase().includes('encrypt')) {
      result.isEncrypted = true;
    }
  }

  return result;
}
