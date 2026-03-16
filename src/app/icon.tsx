import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: '#0D0F14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 96,
        }}
      >
        <svg width="320" height="320" viewBox="0 0 80 80" fill="none">
          <polygon points="40,8 74,72 6,72" fill="#FFFFFF" />
          <polygon points="42,30 30,50 40,50 35,65 52,45 42,45" fill="#0D0F14" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
