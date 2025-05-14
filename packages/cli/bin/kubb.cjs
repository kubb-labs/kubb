#!/usr/bin/env node
try {
  const cachedSourceMaps = new Map()

  require('source-map-support').install({
    retrieveSourceMap(source) {
      if (cachedSourceMaps.has(source)) {
        return cachedSourceMaps.get(source)
      }
      return null
    },
  })
} catch (_err) {}

import('../dist/index.js').then(({ run }) => {
  process.title = 'Kubb'
  run(process.argv)
})
