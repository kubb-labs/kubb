#!/usr/bin/env node

process.setSourceMapsEnabled?.(true)
process.title = 'Kubb'

try {
  const { run } = await import('@kubb/cli')
  await run(process.argv)
} catch (err) {
  console.error(err)
  process.exit(1)
}
