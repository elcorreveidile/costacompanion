import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#F7F4EF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            width: 1200,
            height: 630,
            background: 'linear-gradient(135deg, #F7F4EF 0%, #E8E4DD 100%)',
          }}
        />

        {/* Content container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 60,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 40,
              background: '#2C4A3B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* C arc */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: '12px solid #F7F4EF',
                borderRightColor: '#2C4A3B',
                transform: 'rotate(135deg)',
              }}
            />
            {/* Terra dot */}
            <div
              style={{
                position: 'absolute',
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#E0A877',
                right: 40,
                top: 68,
              }}
            />
          </div>

          {/* Text */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <h1
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 72,
                fontWeight: 600,
                color: '#2C4A3B',
                margin: 0,
                letterSpacing: -1,
              }}
            >
              Costa Companion
            </h1>
            <p
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 32,
                color: '#2C4A3B',
                margin: 0,
                opacity: 0.8,
              }}
            >
              A tu lado, en tu idioma
            </p>
          </div>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: '#E0A877',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
