---
argument-hint: [note to work into the PR body]
description: Get the current branch ready for review and open the pull request
---

!`git status --short --branch`

!`git diff --stat origin/main...HEAD`

Get this branch ready for review and open the pull request. Follow the `pr` skill for the full
sequence, and treat `$ARGUMENTS` as extra context for the body when it is not empty.

1. Run `pnpm format && pnpm lint:fix`, `pnpm typecheck`, and `pnpm test`, and fix what fails.
2. Add a changeset when the branch touches a published package, or say why it needs none.
3. Update the matching kubb.dev page when a public option changed.
4. Commit anything outstanding with a Conventional Commit message.
5. Push with `git push -u origin <branch>`.
6. Open the PR against `main`, ready for review, with the body filling every section of
   `.github/pull_request_template.md`. Tick only the boxes you verified.

Report the PR URL and anything you left unticked.
