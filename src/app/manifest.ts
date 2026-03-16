import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GYMTASTE',
    short_name: 'GymTaste',
    description: "Rate it before you waste it.",
    start_url: '/',
    display: 'standalone',
    background_color: '#0D0F14',
    theme_color: '#0D0F14',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
