import process from 'node:process'

import path from 'node:path'
import { File, Function, createRoot } from '@kubb/react'

const root = createRoot({ stdout: process.stdout })

/**
 * Create a file and append JSX
 */
function Component() {
  return (
    <File path={path.resolve(__dirname, 'App.tsx')} baseName={'App.tsx'}>
      <File.Source>
        <Function export name={'Users'}>
          {`
        return (
          <div className="test" />
          )
        `}
        </Function>
      </File.Source>
    </File>
  )
}

async function start() {
  root.render(<Component />)

  await root.write()
}

start()
