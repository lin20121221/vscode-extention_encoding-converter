import * as fs from 'fs';
import jschardet from 'jschardet';

export interface DetectionResult {
  encoding: string;
  confidence: number;
}

export async function detectEncoding(filePath: string): Promise<DetectionResult> {
  try {
    const buffer = await fs.promises.readFile(filePath);
    const detected = jschardet.detect(buffer);

    return {
      encoding: detected.encoding || 'unknown',
      confidence: detected.confidence || 0
    };
  } catch (error) {
    throw new Error(`Failed to detect encoding: ${error}`);
  }
}

export function normalizeEncoding(encoding: string): string {
  const normalized = encoding.toUpperCase();

  const mappings: { [key: string]: string } = {
    'GB2312': 'GB2312',
    'GBK': 'GBK',
    'UTF-8': 'UTF-8',
    'UTF8': 'UTF-8',
    'BIG5': 'Big5',
    'SHIFT_JIS': 'Shift-JIS',
    'EUC-KR': 'EUC-KR',
    'ISO-8859-1': 'ISO-8859-1',
    'WINDOWS-1252': 'Windows-1252',
    'UTF-16LE': 'UTF-16LE',
    'UTF-16BE': 'UTF-16BE'
  };

  return mappings[normalized] || encoding;
}
