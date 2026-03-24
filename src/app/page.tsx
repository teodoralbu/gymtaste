export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUnifiedFeed, getFollowingUnifiedFeed } from '@/lib/queries'
import { FeedCard } from '@/components/feed/FeedCard'
import { FeedList } from '@/components/feed/FeedList'

export default async function Home({ searchParams }: { searchParams: Promise<{ feed?: string }> }) {
  const { feed } = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isFollowingTab = feed === 'following' && !!user

  const [globalFeed, followingFeed] = await Promise.all([
    getUnifiedFeed(20, user?.id),
    isFollowingTab && user ? getFollowingUnifiedFeed(user.id, 20) : Promise.resolve([]),
  ])

  const feedItems = isFollowingTab ? followingFeed : globalFeed
  const initialCursor = feedItems.length === 20 ? feedItems[feedItems.length - 1].created_at : null

  return (
    <div className="sm:hidden" style={{ paddingBottom: '96px' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 16px 12px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: '21px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em' }}>
          FitFlavor
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/search" style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent' }} aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          <Link href="/notifications" style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent' }} aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── Rate CTA ── */}
      <div style={{ padding: '14px 16px 0' }}>
        <Link href="/rate" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            padding: '14px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: user
              ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
              : 'var(--accent)',
            color: user ? 'var(--accent)' : '#000',
            fontSize: '14px',
            fontWeight: 700,
            textAlign: 'center',
            border: user ? '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' : 'none',
          }}>
            {user ? 'What did you take today? →' : 'Rate it before you waste it →'}
          </div>
        </Link>
      </div>

      {/* ── Community Feed ── */}
      <div style={{ marginTop: '20px' }}>

        {/* Section header */}
        <div style={{ padding: '0 16px', marginBottom: '14px' }}>
          <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)' }}>Community</span>
        </div>

        {/* For You / Following tabs */}
        <div style={{ padding: '0 16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-elevated)', borderRadius: '999px', padding: '4px' }}>
            <Link
              href="/?feed=global"
              style={{
                flex: 1, textAlign: 'center', padding: '8px 0',
                fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                borderRadius: '999px',
                color: !isFollowingTab ? 'var(--text)' : 'var(--text-dim)',
                backgroundColor: !isFollowingTab ? 'var(--bg-card)' : 'transparent',
                boxShadow: !isFollowingTab ? 'var(--shadow-sm)' : 'none',
                transition: 'background-color 0.15s, color 0.15s',
              }}
            >
              For You
            </Link>
            <Link
              href={user ? '/?feed=following' : '/login'}
              style={{
                flex: 1, textAlign: 'center', padding: '8px 0',
                fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                borderRadius: '999px',
                color: isFollowingTab ? 'var(--text)' : 'var(--text-dim)',
                backgroundColor: isFollowingTab ? 'var(--bg-card)' : 'transparent',
                boxShadow: isFollowingTab ? 'var(--shadow-sm)' : 'none',
                transition: 'background-color 0.15s, color 0.15s',
              }}
            >
              Following
            </Link>
          </div>
        </div>

        {/* Feed content */}
        {feedItems.length === 0 && isFollowingTab ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Nothing here yet</p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 16 }}>Follow people to see their reviews in this feed.</p>
            <Link href="/browse" style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700 }}>Browse flavors</Link>
          </div>
        ) : !user && feed === 'following' ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Log in to see your feed</p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 16 }}>Sign in to follow people and see their reviews here.</p>
            <Link href="/login" style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700 }}>Log in</Link>
          </div>
        ) : feedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No reviews yet</p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 16 }}>Be the first to rate a flavor and share your opinion.</p>
            <Link href="/rate" style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700 }}>Rate a flavor</Link>
          </div>
        ) : isFollowingTab ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {feedItems.map((feedItem, idx: number) => (
              <FeedCard key={feedItem.id} item={feedItem} initialLikeCount={0} initialLiked={false} index={idx} />
            ))}
          </div>
        ) : (
          <FeedList initialItems={feedItems} initialCursor={initialCursor} userId={user?.id} />
        )}
      </div>

    </div>
  )
}
