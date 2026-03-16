import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#0D0F14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
        }}
      >
        <svg width="110" height="110" viewBox="0 0 80 80" fill="none">
          <polygon points="40,8 74,72 6,72" fill="#FFFFFF" />
          <polygon points="42,30 30,50 40,50 35,65 52,45 42,45" fill="#0D0F14" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
