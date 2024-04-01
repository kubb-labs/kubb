#!/usr/bin/env bun
try {
  const cachedSourceMaps = new Map()

  // @ts-ignore
  if (!process.isBun) {
    require('source-map-support').install({
      retrieveSourceMap(source) {
        if (cachedSourceMaps.has(source)) {
          return cachedSourceMaps.get(source)
        }
        return null
      },
    })
  }
} catch (err) {}

import('../dist/index.js').then(({ run }) => {
  process.title = 'Kubb'
  run(process.argv)
})
