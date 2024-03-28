#!/usr/bin/env node
try {
  require('source-map-support').install({
    environment: 'node',
    handleUncaughtExceptions: false,
  })
} catch (err) {}

process.title = 'Kubb'
require('../dist/index.cjs').run(process.argv)
