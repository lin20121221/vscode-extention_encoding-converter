import * as fs from 'fs';
import * as iconv from 'iconv-lite';

export async function convertEncoding(
  filePath: string,
  sourceEncoding: string,
  targetEncoding: string = 'utf8'
): Promise<void> {
  try {
    if (!iconv.encodingExists(sourceEncoding)) {
      throw new Error(`Unsupported source encoding: ${sourceEncoding}`);
    }

    if (!iconv.encodingExists(targetEncoding)) {
      throw new Error(`Unsupported target encoding: ${targetEncoding}`);
    }

    const buffer = await fs.promises.readFile(filePath);

    const decoded = iconv.decode(buffer, sourceEncoding);

    const utf8Buffer = iconv.encode(decoded, targetEncoding);

    await fs.promises.writeFile(filePath, utf8Buffer);
  } catch (error) {
    throw new Error(`Failed to convert encoding: ${error}`);
  }
}

export async function isUtf8File(filePath: string): Promise<boolean> {
  try {
    const buffer = await fs.promises.readFile(filePath);
    const decoded = iconv.decode(buffer, 'utf8');
    const reencoded = iconv.encode(decoded, 'utf8');

    return buffer.equals(reencoded);
  } catch {
    return false;
  }
}
