---
name: pr
description: Open or update a pull request in this monorepo. Covers the pre-push checks, the changeset decision, Conventional Commit titles, how to fill the PR template, and what to do once CI runs. Use when asked to open a PR, push a branch for review, fix a red PR, or judge whether a branch is ready to merge.
---

# PR skill

Take a branch from "the code is written" to "a reviewer can merge this". Work the steps in
order. When you cannot finish a step, say so in the PR body rather than skipping it quietly.

## When to use

- Opening a pull request, or pushing a branch you expect to become one.
- Updating a pull request after a review comment or a failing CI run.
- Answering whether a branch is ready to merge.

## 1. Confirm the branch

Never commit to `main`. Check where you are, and branch from an up-to-date `main` if you are
still on it:

```bash
git status
git branch --show-current
git fetch origin main
git switch -c <type>/<short-slug> origin/main
```

Use the same Conventional Commit type you plan to use in the title, so `feat/`, `fix/`,
`docs/`, `chore/`, `refactor/`, `test/`, or `perf/`.

## 2. Run the checks before you push

```bash
pnpm format && pnpm lint:fix
pnpm typecheck
pnpm test
```

Run `pnpm build` too when you changed package source, because packages resolve each other
through their build output.

Everything has to pass before you push. Fix the root cause of a failure. Do not disable a lint
rule, loosen a type, or skip a test to get a green run.

## 3. Decide on a changeset

A change that reaches a published package needs a changeset. A change confined to docs, CI,
tests, or the agent files does not.

```bash
pnpm changeset
```

Pick `patch` for a fix, `minor` for a backwards-compatible feature, and `major` for a breaking
change. Write the summary for a user reading the release notes, not for a reviewer reading the
diff. The `changelog` skill has the wording conventions, and `/changeset` does this step for you.

## 4. Cover the ripple effects

An option or public API you changed shows up in more places than the diff:

- Update the matching kubb.dev page as `AGENTS.md` describes, in this same PR.
- Keep a documented default matching the destructuring default in the plugin's `plugin.ts`.
- Never hand-edit `tools/claude/.claude-plugin/plugin.json`. The release syncs its version from
  `tools/claude/package.json` through `pnpm sync:plugin-version`.

## 5. Commit

One Conventional Commit per logical change, in the imperative, with no trailing period:

```
feat(core): add a plugin resolver cache
```

Check `git diff --cached` before every commit. Never commit a secret, a token, a `.env` file, or
a build artifact. Regenerate a lockfile with pnpm rather than editing it.

## 6. Write the title and body

### Title

One Conventional Commit line, imperative, under 72 characters, no trailing period. It becomes
the squash-merge commit, so write it for whoever reads the changelog later.

### Body

Fill `.github/pull_request_template.md`. Keep its headings and their order, replace each HTML
comment with real content, and delete no section.

Under **Changes**, write two to five sentences. Lead with what changed, then why. Name the
package or file a reviewer should open first. Add `Closes #123` when the PR closes an issue.

Under **Checklist**, tick a box only for something you actually did on this branch. An unticked
box with a one-line reason under it is honest and useful. A ticked box you did not verify costs
a reviewer their trust, so it is the one thing never to do here.

Under **Release impact**, tick the changeset box when `.changeset/` gained a file in this branch,
and the docs box when no published package changed.

Keep the body in plain language: short sentences, active voice, exact paths and commands, no
restating the request back at the reader.

## 7. Push and open the PR

```bash
git push -u origin <branch>
```

Open the PR against `main`, ready for review rather than draft. One PR does one thing. When you
notice unrelated work along the way, leave it out and mention it in the body instead.

## 8. After CI runs

A red PR is work now, whatever its review state.

Read the failing job, reproduce the failure locally, fix the cause, and push again. Re-running a
job is only worth it when the failure never reached a test body, such as a checkout or install
error, or when the same commit passed before.

Answer every review comment. Push the fix for a small, local ask. For a larger ask, reply with
what you propose and let the author decide. Say what you changed and how the reviewer can check
it.

## Guardrails

- Keep the diff to what was asked. Drive-by refactors belong in their own PR.
- Never force-push a branch someone else may have checked out.
- Run the `humanizer` skill over any user-facing markdown in the diff, including the changeset.
- Run the `deslop` skill over generated code before you push.
- Use USA English in the title, body, commits, and changeset.

## Related skills

| Skill | Use for |
| --- | --- |
| [changelog](../changelog/SKILL.md) | Changeset and release-note wording |
| [deslop](../deslop/SKILL.md) | Stripping AI tells from the code in the diff |
| [humanizer](../humanizer/SKILL.md) | Stripping AI tells from the prose in the diff |
| [jsdoc](../jsdoc/SKILL.md) | Documenting a new or changed public API |
