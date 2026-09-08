/** Embedded readers load published PDF assets from this site. */
export function pdfSource(file: string | null): string | null {
  if (!file || !/^\/(?:posts|assets)\//.test(file)) return null;
  try {
    const url = new URL(file, 'https://pdf.invalid');
    if (
      url.origin !== 'https://pdf.invalid' ||
      !/^\/(?:posts|assets)\/.+\.pdf$/i.test(url.pathname) ||
      url.search ||
      url.hash
    ) return null;
    return url.pathname;
  } catch {
    return null;
  }
}
