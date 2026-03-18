---
phase: 02
slug: bug-hunt-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — zero test coverage (accepted risk per STATE.md) |
| **Config file** | none |
| **Quick run command** | N/A — no test suite |
| **Full suite command** | N/A |
| **Estimated runtime** | ~0 seconds (manual only) |

> Per STATE.md: "Zero test coverage — accepted risk for this milestone." Test suite setup is deferred to v2.

---

## Sampling Rate

- **After every task commit:** Manual browser verification of the specific flow fixed
- **After every plan wave:** Manual walkthrough of all BUG-0x flows at 375px mobile viewport
- **Before `/gsd:verify-work`:** All 6 success criteria verified manually
- **Max feedback latency:** Immediate — visual browser check per task

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | BUG-03 | manual smoke | N/A | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | BUG-03 | manual smoke | N/A | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | BUG-04 | manual smoke | N/A | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | BUG-05 | manual smoke | N/A | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | BUG-05 | manual smoke | N/A | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 1 | BUG-06 | manual smoke | N/A | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | BUG-01, BUG-02 | manual walkthrough | N/A | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — there is no test infrastructure to create. Verification is manual per project decision (STATE.md).

*Existing infrastructure covers all phase requirements (manual-only).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Auth session persists across reload | BUG-03 | No test infra; requires real Supabase session | Sign in → hard reload → verify still logged in |
| signUp auto-login on mobile | BUG-03 | Requires Supabase email confirmation setting | Sign up with new email → verify session active without confirming |
| isFirst rating shows "first review" badge | BUG-04 | Requires clean user+flavor state | Rate a product as first reviewer → verify success page shows correct copy |
| Comment count increments after post | BUG-05 | UI state — not persisted | Post a comment → verify FeedCard counter increments without reload |
| FollowButton shows optimistic state | BUG-05 | Real-time UI state | Tap follow → verify instant toggle before server response |
| Avatar reflects immediately in Settings | BUG-06 | Requires file upload + UI re-render | Upload avatar in Settings → verify new image shows without reload |
| signOut clears cached content | BUG-03 | Server cache — requires navigation | Sign out → navigate to / → verify no authenticated content |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
