#!/usr/bin/env bun

import('../dist/index.js').then(({ run }) => {
  process.title = 'Kubb'
  run(process.argv)
})
