# Task 009 — private process docs (Actions-only Pages deploy) · summary

Closed via [PR-30] (merged 2026-06-10); issue [#29].

## Outcome vs acceptance criteria

All four ACs verified live on 2026-06-10, evidence in the
[post-merge verification comment][PR-30-evidence]:

- **AC-1 site intact** ✅ — `/`, `v2.html`, `scene/main.js`,
  `latest_resume.pdf`, `assets/outpost/*.glb` all 200 (cache-busted),
  `<title>` unchanged.
- **AC-2 process docs 404** ✅ — `tasks/**`, `tests/**`, `README.md`,
  `package.json` all 404 on the live domain.
- **AC-3 domain/HTTPS survived** ✅ — `cname: shivambajpai.com`,
  `https_enforced: true` after the `build_type=workflow` flip.
- **AC-4 auto-deploy** ✅ — the live deploy was the `pages` run triggered
  by the merge push itself (no manual dispatch needed).

## What shipped

- [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml) —
  stages an explicit allowlist (`index.html`, `v2.html`, `CNAME`,
  `latest_resume.pdf`, `LICENSE`, `scene/`, `assets/`) into `_site/` and
  deploys only that artifact. Everything else 404s.
- Pages `build_type` flipped `legacy → workflow` via the API (config
  change, not in-repo).

## Gotchas to carry forward

1. **Pushing `.github/workflows/**` needs the `workflow` OAuth scope.**
   A `repo`-scoped token gets `refusing to allow an OAuth App to create
   or update workflow` on push — and the Contents API enforces the same
   restriction, so there is no API workaround. Fix is a one-time
   `gh auth refresh -h github.com -s workflow`.
2. **The on-merge `pages` run went green before the explicit
   `build_type` flip** — `actions/configure-pages` + `deploy-pages`
   handled it; the API flip then just confirmed `build_type: workflow`.
   Don't be surprised by that ordering on a future repo.
3. **New public files must be added to the allowlist** in
   [`pages.yml`](../../.github/workflows/pages.yml) or they 404 in
   production while working fine locally. The pre-merge reference audit
   (HTML `src`/`href` + module imports + loader base paths) is the
   template for checking this.

## Follow-ups

None. The text-level scrub ([PR-28]) plus this structural fix close out
the 2026-06-10 security-scan findings.

[#29]: https://github.com/shivamsbajpai/personal_website/issues/29
[PR-28]: https://github.com/shivamsbajpai/personal_website/pull/28
[PR-30]: https://github.com/shivamsbajpai/personal_website/pull/30
[PR-30-evidence]: https://github.com/shivamsbajpai/personal_website/pull/30#issuecomment-4673053553
