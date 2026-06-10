# Task 009 — private process docs (Actions-only Pages deploy) · Closes [#29]

Plan: [`plan.md`](plan.md) · Branch `task/29-private-pages-deploy`

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | allowlist deploy workflow | DONE spec ✅ code ✅ | (feat) | allowlist grep-verified |
| 2 | PR (owner merge — deploy gate) | DONE spec ✅ code ✅ | (docs) | [PR-30] merged 2026-06-10 (owner-delegated merge) |
| 3 | flip Pages build_type → workflow | DONE spec ✅ code ✅ | (config) | API flip confirmed `build_type: workflow`; on-merge run already green |
| 4 | live verification (AC-1…AC-4) | DONE spec ✅ code ✅ | — | all 4 ACs ✅, evidence in [PR-30 comment][PR-30-evidence]; ACs ticked on [#29] |

## AC → step mapping

AC-1 site intact → 1,4 · AC-2 process docs 404 → 1,4 · AC-3 domain/HTTPS
survive → 3,4 · AC-4 auto-deploy on merge → 1,4 (full AC text in [#29])

## Resume sequence for next session

**Task complete.** All steps DONE, all ACs verified live (see
[`summary.md`](summary.md)). Owner ran `gh auth refresh -s workflow`
(defect 1 resolved), explicitly approved the Actions allowlist route
after weighing the `/docs`-folder alternative, and delegated the [PR-30]
merge. Remaining: the docs PR carrying this close-out merges, then [#29]
is closed (done at close-out time if you're reading this on `master`).

## Plan defects observed

1. **Push rejected: `workflow` scope missing.** The plan assumed the PR
   could be opened straight after the feat commit, but GitHub refuses any
   push touching `.github/workflows/**` from an OAuth token without the
   `workflow` scope. Same restriction applies to the Contents API, so
   there's no API workaround. Fix: owner runs
   `gh auth refresh -h github.com -s workflow` once (interactive/browser),
   then push + `gh pr create` proceed normally. Pre-merge verification
   (YAML parse, allowlist existence, full reference audit, staging
   simulation with zero process-file leaks) completed before the push
   attempt; evidence is in the drafted PR body.

## Cross-references

- Issue [#29] · Epic [#2] · Trigger: 2026-06-10 security scan + [PR-28] scrub
- Workflow: [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml)

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#29]: https://github.com/shivamsbajpai/personal_website/issues/29
[PR-28]: https://github.com/shivamsbajpai/personal_website/pull/28
[PR-30]: https://github.com/shivamsbajpai/personal_website/pull/30
[PR-30-evidence]: https://github.com/shivamsbajpai/personal_website/pull/30#issuecomment-4673053553
