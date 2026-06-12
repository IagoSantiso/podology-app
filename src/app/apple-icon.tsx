import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: 112,
          fontWeight: 900,
          fontFamily: 'Arial Black, Arial, sans-serif',
        }}
      >
        Q
      </div>
    ),
    { ...size }
  )
}
