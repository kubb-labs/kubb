#!/usr/bin/env node
try {
  require('source-map-support').install({
    environment: 'node',
    handleUncaughtExceptions: false,
  })
} catch (err) {}

import('../dist/index.js').then(({ run }) => {
  process.title = 'Kubb'
  run(process.argv)
})
