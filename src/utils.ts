export function isRgbOrHex(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{3,4}){1,2}$/;
  const rgbRegex = /^rgba?\(\s*\d+\s*(?:,\s*\d+\s*){2}(?:,\s*[\d.]+\s*)?\)$/i;
  
  return hexRegex.test(color) || rgbRegex.test(color);
}