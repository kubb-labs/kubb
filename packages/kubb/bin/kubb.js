#!/usr/bin/env node
import('@kubb/cli').then(({ default: runCLI }) => {
  runCLI(process.argv)
})
