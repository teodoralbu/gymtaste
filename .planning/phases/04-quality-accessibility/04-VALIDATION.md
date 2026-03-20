---
phase: 4
slug: quality-accessibility
status: draft
nyquist_compliant: false
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
| 4-01-01 | 01 | 1 | QUAL-01 | compile | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 4-01-02 | 01 | 1 | QUAL-02 | compile | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 4-02-01 | 02 | 1 | UX-01 | manual | browser keyboard nav | ✅ | ⬜ pending |
| 4-02-02 | 02 | 1 | UX-02 | manual | browser loading states | ✅ | ⬜ pending |
| 4-02-03 | 02 | 1 | UX-03 | manual | WCAG contrast check | ✅ | ⬜ pending |
| 4-02-04 | 02 | 1 | UX-04 | manual | avatar upload rejection | ✅ | ⬜ pending |
| 4-02-05 | 02 | 2 | UX-05 | manual | loading.tsx renders | ✅ | ⬜ pending |
| 4-03-01 | 03 | 2 | QUAL-03 | manual | avatar validation message | ✅ | ⬜ pending |

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
| Empty states render | UX-02 | Requires empty data condition | Test with new account that has no ratings/follows |
| Avatar invalid file rejection | UX-04 | Requires interaction | Attempt upload of .gif or file > 5MB; verify clear error message shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
