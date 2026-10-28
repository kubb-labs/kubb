#!/usr/bin/env node

// Mapping 35 bundles costs 10 to 30 ms per run, so only debug runs pay for readable stack traces.
if (['1', 'true'].includes(process.env.KUBB_DEBUG ?? '')) process.setSourceMapsEnabled?.(true)
process.title = 'Kubb'

try {
  const { run } = await import('@kubb/cli')
  await run(process.argv.slice(2))
} catch (err) {
  console.error(err)
  process.exit(1)
}
