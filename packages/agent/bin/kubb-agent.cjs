#!/usr/bin/env node

import('../dist/index.js')
  .then(({ run }) => {
    process.title = 'Kubb Agent'
    run(process.argv)
  })
  .catch((err) => {
    console.error('Failed to start Kubb Agent server:', err)
    process.exit(1)
  })
