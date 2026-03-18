---
phase: 1
slug: mobile-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — zero test coverage in codebase |
| **Config file** | none |
| **Quick run command** | Chrome DevTools device emulation at 375px |
| **Full suite command** | Manual audit across 320px, 375px, 390px viewports |
| **Estimated runtime** | ~10 minutes per wave |

---

## Sampling Rate

- **After every task commit:** Verify affected component in Chrome DevTools mobile emulation at 375px
- **After every plan wave:** Full manual audit of all affected screens at 320px and 390px
- **Before `/gsd:verify-work`:** All screens verified on mobile viewport in DevTools

---

## Per-Task Verification Map

| Task ID | Requirement | Test Type | Automated Command | Status |
|---------|-------------|-----------|-------------------|--------|
| touch targets (Navbar) | MOB-01, MOB-06 | manual | DevTools: verify ≥44px hit areas on search/notification icons | ⬜ pending |
| touch targets (ThemeToggle) | MOB-06 | manual | DevTools: verify ≥44px hit area on ThemeToggle | ⬜ pending |
| touch targets (LikeButton) | MOB-06 | manual | DevTools: verify ≥44px tap area on LikeButton | ⬜ pending |
| iOS input zoom fix | MOB-03, MOB-04 | manual | DevTools: simulate iOS — focus any input, verify no zoom | ⬜ pending |
| feed card overflow | MOB-02 | manual | DevTools 320px: scroll feed, verify no horizontal scroll | ⬜ pending |
| rating form mobile | MOB-03 | manual | DevTools 375px: verify sliders/inputs/submit all visible and usable | ⬜ pending |
| profile/settings layout | MOB-04 | manual | DevTools 375px: verify no overflow, avatar upload button visible | ⬜ pending |
| page bottom padding | MOB-05 | manual | DevTools 375px: scroll all pages to bottom, verify content not behind nav | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — this phase is manual-only testing. No test infrastructure setup required.

*Existing infrastructure covers all phase requirements (manual device emulation).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bottom nav touch targets ≥44px, active route highlighted | MOB-01 | Visual/interaction — requires device emulation | Open DevTools → iPhone 15 Pro → tap each nav tab, verify 44px hit area and active highlight |
| Feed cards no overflow at 320px | MOB-02 | Visual testing requires viewport simulation | DevTools → iPhone SE (320px) → scroll feed, check for horizontal scroll |
| Rating form usable on mobile | MOB-03 | Touch interaction requires emulation | DevTools → iPhone 15 Pro → rate a product, verify sliders draggable, inputs focusable without zoom, submit visible |
| Profile/settings no overflow | MOB-04 | Visual layout verification | DevTools → iPhone 15 Pro → open settings, check all fields visible, no overflow |
| No layout jumps on navigation | MOB-05 | Visual transition — requires real navigation | DevTools mobile → tap nav tabs, verify smooth transitions, no content jump |
| All tap targets ≥44px | MOB-06 | CSS measurement audit | DevTools → inspect interactive elements, verify computed min-height/min-width ≥44px |
| iOS zoom on input focus | MOB-03, MOB-04 | iOS Safari-specific behavior | DevTools → Responsive → set UA to Safari iOS → focus input fields, verify no zoom |

---

## Validation Sign-Off

- [ ] All tasks have manual verify steps documented
- [ ] Sampling continuity: verify after each task using DevTools mobile emulation
- [ ] Wave 0 not needed — manual-only phase
- [ ] No automated test framework required
- [ ] Feedback latency: ~2 minutes per task (DevTools check)
- [ ] `nyquist_compliant: true` set in frontmatter after all tasks verified

**Approval:** pending
