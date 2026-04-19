#!/usr/bin/env node
process.setSourceMapsEnabled?.(true)

const { run } = await import('../dist/index.js')
process.title = 'Kubb'
run(process.argv)
