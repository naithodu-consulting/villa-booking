import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Default share image for every page.
export const alt = 'Villa 19: Private Villa in Mangalore';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const svg = async (name: string) =>
    `data:image/svg+xml;base64,${(await readFile(join(process.cwd(), 'public', name))).toString('base64')}`;
  const wordmarkSrc = await svg('villa19-wordmark-knockout.svg');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#3A0E1F',
          color: '#FBF7F1',
          border: '14px solid #5C1732',
        }}
      >
        {/* The logo's own lettering, not a system font standing in for it */}
        <img src={wordmarkSrc} width={580} height={130} alt="Villa 19" />
        <div style={{ fontSize: 26, letterSpacing: 10, color: '#C9944A', marginTop: 8 }}>BY HABBAA</div>
        <div style={{ width: 80, height: 2, background: 'rgba(201,148,74,0.6)', marginTop: 36 }} />
        <div style={{ fontSize: 32, marginTop: 30, color: 'rgba(251,247,241,0.85)', letterSpacing: 1 }}>
          Private Villa in Mangalore
        </div>
      </div>
    ),
    size,
  );
}
