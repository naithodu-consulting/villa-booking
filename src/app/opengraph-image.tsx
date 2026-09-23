import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Default share image for every page. Replace with a real villa photo per page
// once professional photography exists.
export const alt = 'Villa 19 by Habbaa, a private 4-bedroom villa in Urwa, Mangalore';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logo = await readFile(join(process.cwd(), 'public/habbaa-logo-white.svg'));
  const logoSrc = `data:image/svg+xml;base64,${logo.toString('base64')}`;

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
          background: '#3C1717',
          color: '#FBF7F1',
          border: '14px solid #5A2626',
        }}
      >
        <img src={logoSrc} width={150} height={150} alt="" style={{ borderRadius: 999 }} />
        <div style={{ fontSize: 96, letterSpacing: 12, marginTop: 36, fontWeight: 700 }}>VILLA 19</div>
        <div style={{ fontSize: 26, letterSpacing: 10, color: '#C9944A', marginTop: 8 }}>BY HABBAA</div>
        <div style={{ width: 80, height: 2, background: 'rgba(201,148,74,0.6)', marginTop: 36 }} />
        <div style={{ fontSize: 32, marginTop: 30, color: 'rgba(251,247,241,0.85)' }}>
          Private 4-bedroom villa in Urwa, Mangalore
        </div>
      </div>
    ),
    size,
  );
}
