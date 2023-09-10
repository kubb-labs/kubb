#!/usr/bin/env node
try {
  require('source-map-support').install({
    handleUncaughtExceptions: false,
  })
} catch (err) {}

import('../dist/index.js').then(({ default: runCLI }) => {
  process.title = 'Kubb'
  runCLI(process.argv)
})
