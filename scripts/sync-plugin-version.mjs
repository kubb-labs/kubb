import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const packageJsonPath = `${root}tools/claude/package.json`
const pluginJsonPath = `${root}tools/claude/.claude-plugin/plugin.json`

const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const pluginJsonText = readFileSync(pluginJsonPath, 'utf-8')
const currentVersion = JSON.parse(pluginJsonText).version

if (currentVersion === version) {
  console.log(`tools/claude/.claude-plugin/plugin.json is already at ${version}`)
} else {
  // A targeted replace keeps the file's existing formatting (single-line arrays, key
  // order) intact instead of re-serializing the whole document.
  const updated = pluginJsonText.replace(
    /"version":\s*"[^"]*"/,
    `"version": "${version}"`,
  )
  writeFileSync(pluginJsonPath, updated)
  console.log(`Synced tools/claude/.claude-plugin/plugin.json to ${version}`)
}
