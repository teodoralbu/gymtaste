---
phase: 4
slug: quality-accessibility
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-20
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler (tsc) + manual browser testing |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npx next build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npx next build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-T1 | 01 | 1 | QUAL-01, QUAL-02, QUAL-03 | compile | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 4-01-T2 | 01 | 1 | QUAL-01 | compile | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 4-02-T1 | 02 | 1 | UX-05 | compile + file check | `ls src/app/loading.tsx && npx tsc --noEmit` | ✅ | ⬜ pending |
| 4-02-T2 | 02 | 1 | UX-04 | compile + grep | `grep "No reviews yet" src/app/page.tsx && npx tsc --noEmit` | ✅ | ⬜ pending |
| 4-03-T1 | 03 | 2 | UX-03 | compile + grep | `grep "#6B7A90" src/app/globals.css && npx tsc --noEmit` | ✅ | ⬜ pending |
| 4-03-T2 | 03 | 2 | UX-01 | compile + grep | `grep 'role="button"' src/components/rating/ReviewCard.tsx && npx tsc --noEmit` | ✅ | ⬜ pending |
| 4-04-T1 | 04 | 3 | UX-02 | compile + grep | `grep "'s avatar" src/components/feed/FeedCard.tsx && npx tsc --noEmit` | ✅ | ⬜ pending |
| 4-04-T2 | 04 | 3 | UX-02 | compile + grep | `grep "'s avatar" src/app/users/\[username\]/page.tsx && npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test framework installation needed — validation relies on TypeScript compiler for type safety and manual browser testing for accessibility/UX behaviors.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Keyboard focus states visible | UX-01 | Visual CSS inspection required | Tab through all interactive elements; verify visible :focus-visible outline |
| Loading skeletons appear during fetch | UX-05 | Requires live network throttling | Chrome DevTools → Network → Slow 3G; navigate pages and verify skeleton renders |
| Color contrast WCAG AA | UX-03 | Requires visual tool | Use Chrome DevTools accessibility audit or axe extension on both light/dark themes |
| Empty states render | UX-04 | Requires empty data condition | Test with new account that has no ratings/follows |
| Avatar invalid file rejection | QUAL-03 | Requires interaction | Attempt upload of .gif or file > 5MB; verify clear error message shown |
| Descriptive alt text on images | UX-02 | Requires screen reader or DevTools audit | Inspect img elements; verify alt is descriptive not empty |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
