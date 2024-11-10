import process from 'node:process'
import React from 'react'

import path from 'node:path'
import { Const, File, createRoot } from '@kubb/react'

const root = createRoot({ stdout: process.stdout })

/**
 * Create a simple file and write it to the file-system
 */
function Component() {
  return (
    <File path={path.resolve(__dirname, 'result.ts')} baseName={'result.ts'}>
      <File.Source>
        <Const name={'hello'}>"World!"</Const>
      </File.Source>
    </File>
  )
}

async function start() {
  root.render(<Component />)
  console.log('\nFiles: ', root.files.length)
  await root.write()
}

start()
