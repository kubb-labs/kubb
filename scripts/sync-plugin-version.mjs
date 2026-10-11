import { readFileSync, writeFileSync } from 'node:fs'

const packageJsonUrl = new URL('../tools/claude/package.json', import.meta.url)
const pluginJsonUrl = new URL('../tools/claude/.claude-plugin/plugin.json', import.meta.url)
const { version } = JSON.parse(readFileSync(packageJsonUrl, 'utf-8'))

// A targeted replace keeps the file's formatting (single-line arrays, key order) intact.
writeFileSync(pluginJsonUrl, readFileSync(pluginJsonUrl, 'utf-8').replace(/"version":\s*"[^"]*"/, `"version": "${version}"`))
console.log(`Synced tools/claude/.claude-plugin/plugin.json to ${version}`)
