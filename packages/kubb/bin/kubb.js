#!/usr/bin/env node
import('@kubb/cli').then(({ run }) => {
  run(process.argv)
})
