import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
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
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '2.5px solid #F7F4EF',
            borderRightColor: '#2C4A3B',
            transform: 'rotate(135deg)',
            display: 'flex',
          }}
        />
        {/* Terra dot */}
        <div
          style={{
            position: 'absolute',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#E0A877',
            right: 8,
            top: 13,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
