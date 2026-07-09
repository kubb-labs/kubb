#!/usr/bin/env node
import { appendFileSync } from 'node:fs'

// Used for a manual `promote`-only dispatch: when a previous run staged
// packages on npm but was interrupted before `promote` could verify and
// release them, there is no new version to stage, so `changesets/action`
// reports nothing. `npm stage list` would normally read back what's already
// on npm, but that subcommand requires interactive 2FA/proof-of-presence and
// cannot authenticate via OIDC in CI (only `npm publish` and `npm stage
// publish` support trusted-publisher tokens), so a maintainer runs `npm
// stage list` locally, or checks npmjs.com, and passes the result through
// the `staged_packages` workflow input instead. This just validates and
// forwards it.
export function parseStagedPackagesInput(raw) {
  const staged = JSON.parse(raw || '[]')
  if (!Array.isArray(staged) || staged.some((pkg) => !pkg?.name || !pkg?.version)) {
    throw new Error('staged_packages must be a JSON array of {"name", "version"} objects, e.g. [{"name":"kubb","version":"4.2.0"}].')
  }
  return staged
}

function main() {
  let staged
  try {
    staged = parseStagedPackagesInput(process.env.STAGED_PACKAGES_INPUT)
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }

  if (staged.length === 0) {
    console.error(
      'staged_packages input is empty. Run `npm stage list` locally (it needs interactive 2FA and cannot run in CI) and pass the result to this dispatch.',
    )
    process.exit(1)
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, 'staged=true\n')
    appendFileSync(process.env.GITHUB_OUTPUT, `staged_packages=${JSON.stringify(staged)}\n`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
