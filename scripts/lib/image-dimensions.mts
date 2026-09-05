import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { imageSize } from 'image-size';

export interface ImageDimensions {
  width: number;
  height: number;
}

export function getImageDimensions(file: string): ImageDimensions | null {
  try {
    if (extname(file).toLowerCase() === '.svg') return getSvgDimensions(file);

    const { width, height } = imageSize(readFileSync(file));
    return Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0
      ? { width, height }
      : null;
  } catch {
    return null;
  }
}

function positiveNumber(value: string | undefined): number | null {
  const number = Number.parseFloat(value ?? '');
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function getSvgDimensions(file: string): ImageDimensions | null {
  if (extname(file).toLowerCase() !== '.svg') return null;

  const source = readFileSync(file, 'utf8');
  const openingTag = source.match(/<svg\b[^>]*>/i)?.[0];
  if (!openingTag) return null;

  const attribute = (name: string) =>
    openingTag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1];
  const viewBox = attribute('viewBox')
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);

  if (viewBox?.length === 4 && viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0) {
    return { width: Math.round(viewBox[2]), height: Math.round(viewBox[3]) };
  }

  const width = positiveNumber(attribute('width'));
  const height = positiveNumber(attribute('height'));
  return width && height ? { width: Math.round(width), height: Math.round(height) } : null;
}
