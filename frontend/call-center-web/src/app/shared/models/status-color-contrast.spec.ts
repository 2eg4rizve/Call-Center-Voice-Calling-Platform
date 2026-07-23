const statusPairs = [
  ['#05603a', '#d1fadf'],
  ['#1849a9', '#dbe8ff'],
  ['#93370d', '#fef0c7'],
  ['#912018', '#fee4e2'],
  ['#344054', '#f2f4f7'],
] as const;

function luminance(hex: string): number {
  const channels = hex.match(/[a-f\d]{2}/gi)!.map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('status color tokens', () => {
  it.each(statusPairs)('%s on %s meets WCAG AA normal-text contrast', (foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
