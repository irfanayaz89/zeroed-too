/** Convert hex (e.g. #6C63FF) to rgba string for tinted backgrounds. */
export function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace(/^#/, "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Category color at 6% opacity for block card backgrounds. */
export function categoryTintBg(hex: string): string {
  return hexToRgba(hex, 0.06);
}
