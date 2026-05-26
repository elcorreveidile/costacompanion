import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: '#2C4A3B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* C arc: open circle with hidden right side */}
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            border: '14px solid #F7F4EF',
            borderRightColor: '#2C4A3B',
            transform: 'rotate(135deg)',
            display: 'flex',
          }}
        />
        {/* Terra dot */}
        <div
          style={{
            position: 'absolute',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#E0A877',
            right: 45,
            top: 76,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
