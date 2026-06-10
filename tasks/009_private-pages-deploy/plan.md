# Plan — private process docs via Actions-only Pages deploy (Closes [#29])

## Goal

The legacy branch-root Pages build publishes every file on `master` to the
public domain — `tasks/**` INDEXes, plans, and evidence were fetchable on
shivambajpai.com even though the repo is private (2026-06-10 security scan;
the credential-wiring notes were scrubbed via [PR-28] as a stopgap). Make
the exposure structural: deploy from an explicit allowlist.

## Steps

1. **Workflow** — [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml):
   stage `index.html`, `v2.html`, `CNAME`, `latest_resume.pdf`, `LICENSE`,
   `scene/`, `assets/` into `_site/`; `upload-pages-artifact` + `deploy-pages`.
   Allowlist verified against actual references (`grep` of `index.html` /
   `scene/main.js`: only `./scene/main.js`, `./latest_resume.pdf`,
   `assets/outpost/`; favicon is inline).
2. **PR** — owner merges (deploy-config change = owner-gated).
3. **Flip build type** — `gh api -X PUT .../pages` `build_type: workflow`
   (after merge, so the legacy build never gaps), then dispatch/verify the
   workflow run.
4. **Live verification** — AC-1 site files 200 and byte-identical; AC-2
   `tasks/**`/`tests/**`/`README.md` 404; AC-3 custom domain + HTTPS intact;
   AC-4 next master merge auto-deploys.

## Out of scope

- Purging old Pages content from third-party caches (Pages serves the new
  artifact immediately; CDN cache ages out within minutes).
- Restructuring the repo (no file moves; the allowlist does the isolation).

[#29]: https://github.com/shivamsbajpai/personal_website/issues/29
[PR-28]: https://github.com/shivamsbajpai/personal_website/pull/28
