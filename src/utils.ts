import crypto from 'node:crypto';

export function isRgbOrHex(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{3,4}){1,2}$/;
  const rgbRegex = /^rgba?\(\s*\d+\s*(?:,\s*\d+\s*){2}(?:,\s*[\d.]+\s*)?\)$/i;
  
  return hexRegex.test(color) || rgbRegex.test(color);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getNonce(): string {
  return crypto.randomBytes(32).toString('base64');
}

export function getRandomHexColor(): string {
  const randomInt = Math.floor(Math.random() * 0xffffff);
  return `#${randomInt.toString(16).padStart(6, '0')}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}