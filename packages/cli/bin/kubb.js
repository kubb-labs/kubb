#!/usr/bin/env node

process.setSourceMapsEnabled?.(true)
process.title = 'Kubb'

try {
  const { run } = await import('../dist/index.js')
  await run(process.argv.slice(2))
} catch (err) {
  console.error(err)
  process.exit(1)
}
