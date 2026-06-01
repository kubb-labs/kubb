#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'

function readPreTag() {
  try {
    return JSON.parse(readFileSync('.changeset/pre.json', 'utf8')).tag ?? null
  } catch {
    return null
  }
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const tag = readPreTag()
const stageArgs = ['stage', 'publish', '-r', '--no-git-check', '--access', 'public']
if (tag) stageArgs.push('--tag', tag)

run('pnpm', stageArgs)
run('pnpm', ['exec', 'changeset', 'tag'])

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, 'staged=true\n')
}
