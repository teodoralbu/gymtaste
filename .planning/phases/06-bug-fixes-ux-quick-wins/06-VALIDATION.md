---
phase: 6
slug: bug-fixes-ux-quick-wins
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — zero test coverage (accepted tech debt) |
| **Config file** | none |
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
| 6-01-01 | 01 | 1 | FIX-01 | manual | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 6-01-02 | 01 | 1 | FIX-02 | manual | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 6-01-03 | 01 | 1 | FIX-03 | manual | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 6-01-04 | 01 | 1 | FIX-04 | manual | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 6-01-05 | 01 | 1 | FIX-05 | manual | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework setup needed — project has zero test coverage by design (accepted tech debt per PROJECT.md). TypeScript compilation serves as the automated verification layer.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Username with dot saves successfully | FIX-01 | No test suite | Set username to "john.doe" in settings, save, verify no error |
| Email readable on light theme | FIX-02 | Visual/contrast check | Sign up, switch to light theme on success screen, verify email text is visible |
| Taste tags consistent | FIX-03 | Data-dependent runtime behavior | Browse product cards, verify tags show or are absent consistently |
| Browse button gone from nav | FIX-04 | Visual check | Open app on mobile, verify bottom nav has 4 tabs (no Browse) |
| Hero image appears on landing | FIX-05 | Visual check | Open home page logged-out, verify image appears above tagline |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
