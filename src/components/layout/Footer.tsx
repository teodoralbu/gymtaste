import Link from 'next/link'

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '1024px',
        margin: '0 auto',
        padding: '56px 24px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      }}>

        {/* Top row: logo + nav */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '32px',
          marginBottom: '40px',
        }}>

          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="4" fill="var(--bg-elevated)" />
                <polygon points="16,4 30,28 2,28" fill="var(--text)" />
                <polygon points="17,13 12,21 16,21 14,27 21,19 17,19" fill="var(--bg-elevated)" />
              </svg>
              <span style={{
                fontSize: '14px',
                fontWeight: 900,
                letterSpacing: '0.06em',
                color: 'var(--text)',
              }}>
                GYM<span style={{ color: 'var(--accent)' }}>TASTE</span>
              </span>
            </div>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-faint)',
              lineHeight: 1.6,
              margin: 0,
              fontStyle: 'italic',
            }}>
              Rate it before you waste it.
            </p>
          </div>

          {/* Nav groups */}
          <div style={{
            display: 'flex',
            gap: '48px',
            flexWrap: 'wrap',
          }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                Explore
              </span>
              {[
                { href: '/browse', label: 'Browse' },
                { href: '/leaderboard', label: 'Leaderboard' },
                { href: '/submit', label: 'Submit product' },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                Legal
              </span>
              {[
                { href: '/privacy', label: 'Privacy' },
                { href: '/terms', label: 'Terms' },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </div>

          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-soft)' }} />

        {/* Bottom row */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          paddingTop: '24px',
        }}>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-faint)',
            margin: 0,
            lineHeight: 1.6,
            maxWidth: '480px',
          }}>
            All reviews represent the personal opinions of individual users. GymTaste does not endorse
            or verify user-submitted content. Supplement information is for informational purposes only
            and does not constitute medical advice.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-faint)', margin: 0, whiteSpace: 'nowrap' }}>
            &copy; {new Date().getFullYear()} GymTaste
          </p>
        </div>

      </div>
    </footer>
  )
}
