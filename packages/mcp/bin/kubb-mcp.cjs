#!/usr/bin/env node

import('../dist/index.js')
  .then(({ run }) => {
    process.title = 'Kubb MCP'
    run(process.argv)
  })
  .catch((err) => {
    console.error('Failed to start Kubb MCP server:', err)
    process.exit(1)
  })
