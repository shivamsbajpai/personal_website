# Task 009 — private process docs (Actions-only Pages deploy) · Closes [#29]

Plan: [`plan.md`](plan.md) · Branch `task/29-private-pages-deploy`

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | allowlist deploy workflow | DONE spec ✅ code ✅ | (feat) | allowlist grep-verified |
| 2 | PR (owner merge — deploy gate) | DONE spec ✅ code ✅ | (docs) | [PR-30] open, all pre-merge checks evidenced in body; awaits owner merge |
| 3 | flip Pages build_type → workflow | pending | | after merge, then dispatch |
| 4 | live verification (AC-1…AC-4) | pending | | evidence on the PR |

## AC → step mapping

AC-1 site intact → 1,4 · AC-2 process docs 404 → 1,4 · AC-3 domain/HTTPS
survive → 3,4 · AC-4 auto-deploy on merge → 1,4 (full AC text in [#29])

## Resume sequence for next session

1. If [PR-30] is unmerged: it awaits the owner (deploy-config gate).
   Owner ran `gh auth refresh -s workflow` 2026-06-10 (defect 1 resolved)
   and explicitly approved the Actions allowlist route after weighing the
   `/docs`-folder alternative.
2. After merge: `gh api -X PUT repos/shivamsbajpai/personal_website/pages
   -f build_type=workflow`, then confirm the `pages` workflow run succeeds
   (`gh run list --workflow=pages`).
3. Verify live: `/` + `scene/main.js` + `assets/outpost/*` +
   `latest_resume.pdf` → 200; `tasks/008_scroll-cadence/INDEX.md`,
   `tests/state.test.js`, `README.md` → 404; `gh api .../pages` still shows
   `cname: shivambajpai.com`, `https_enforced: true`.
4. Post-merge: tick remaining AC boxes on the PR with evidence, write
   `summary.md`, close out.

## Plan defects observed

1. **Push rejected: `workflow` scope missing.** The plan assumed the PR
   could be opened straight after the feat commit, but GitHub refuses any
   push touching `.github/workflows/**` from an OAuth token without the
   `workflow` scope — the keychain `gh` token carries only
   `gist, read:org, repo` (and the proxy token's account isn't a
   collaborator, so it can't push at all). Same restriction applies to the
   Contents API, so there's no API workaround. Fix: owner runs
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
