# Plan: centralize canary publishing in `kubb-labs/config`

Handoff notes for updating the shared release tooling. The consuming repos
(`kubb-labs/kubb`, `kubb-labs/plugins`, `stijnvanhulle/template`) are already
updated; the items below are the matching changes that still need to land in
`kubb-labs/config` (and a couple of per-repo follow-ups that depend on them).

## Background

The release flow runs in two halves:

- A `version` job (in each consuming repo's `.github/workflows/release.yml`) opens
  the **Version Packages** PR.
- The **reusable** workflow `kubb-labs/config/.github/workflows/release.yml@main`
  handles staging/publishing for `kubb` and `plugins`.

Recent fixes in the consuming repos:

- The `version` job now calls the changeset CLI directly — `version: pnpm exec changeset version`
  — instead of a `package.json` script. (`pnpm version` is a reserved built-in and never
  ran `changeset version`, so no Version Packages PR was produced.)
- `.github/workflows/release.yml` was added to `on.push.paths` so editing the workflow
  re-triggers it.
- The `version`, `version:canary`, and `release:canary` scripts were **removed** from
  every `package.json`. The workflow calls the changeset CLI directly. `release`,
  `release:stage`, and `release:stage:ci` are kept.
- `template` (not in changesets pre-mode) gained a `canary` job that publishes a
  changesets **snapshot** on every push.

## What `kubb-labs/config` needs to do

### 1. Host `canary.sh`

Add the script below to `kubb-labs/config` (e.g. `.github/canary.sh`) so it is no longer
duplicated in each repo under `.github/canary.sh` and referenced via relative paths.

```bash
#!/usr/bin/env bash
npm --no-git-tag-version version minor || true

version=$(node -p "require('./package.json').version")
canary_date=$(date +'%Y%m%dT%H%M%S')
canary_version=$(echo $version'-canary.'$canary_date)

echo "Version that will be published: $canary_version"
npm --no-git-tag-version version $canary_version || true
```

Make it available to consumers in one of these ways (pick one):

- The `setup` composite (`kubb-labs/config/.github/setup`) drops/symlinks the script into
  the workspace, or
- The reusable release workflow checks out `kubb-labs/config` and runs the script from there.

### 2. Add canary-on-push to the reusable release workflow

Goal: **publish a canary on every push that triggers the release job.**

- `kubb` and `plugins` are in changesets **pre-mode (`beta`)**, where
  `changeset version --snapshot` is **not allowed**. For these repos the canary must use the
  **timestamp** path (`canary.sh` → build → `pnpm publish --tag canary`), not snapshots.
- `template` is not in pre-mode and already publishes a snapshot canary on push in its own
  workflow, so it does not depend on this.

Suggested shape: a `canary` input/mode on the reusable workflow that, on `push`, runs the
hosted `canary.sh` per package and publishes under the `canary` dist-tag (never `latest`).

### 3. Replace removed npm scripts

The reusable workflow (and any composite) must **not** call `pnpm version`, `pnpm run version`,
`pnpm version:canary`, or `pnpm release:canary` — those scripts were removed from the consuming
repos. Use the changeset CLI directly:

| Removed script | Replace with |
| --- | --- |
| `pnpm version` / `pnpm run version` | `pnpm exec changeset version` |
| `pnpm version:canary` | `pnpm exec changeset version --snapshot canary` |
| `pnpm release:canary` | `pnpm exec changeset publish --no-git-tag --tag canary` |

`pnpm exec` matters: it puts the local `changeset` binary on `PATH`.

## Per-repo follow-ups (after config is ready)

Apply these to `kubb`, `plugins`, and `template` once `kubb-labs/config` hosts `canary.sh`:

- Delete the local `.github/canary.sh`.
- Update the 23 per-package `release:canary` scripts so they no longer reference
  `../../.github/canary.sh` (point at the config-provided script, or drop the script if the
  reusable workflow owns canary entirely).

These were intentionally left in place for now so nothing breaks before config is updated.

## Checklist

- [ ] Add `canary.sh` to `kubb-labs/config` and expose it to consumers.
- [ ] Add canary-on-push (timestamp path) to the reusable release workflow for pre-mode repos.
- [ ] Replace `version` / `version:canary` / `release:canary` script calls with the changeset CLI.
- [ ] Verify "Allow GitHub Actions to create and approve pull requests" is enabled per repo.
- [ ] Per repo: remove local `.github/canary.sh` and fix the per-package `release:canary` paths.
