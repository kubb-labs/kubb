import process from 'node:process'

import path from 'node:path'
import { Const, File, createRoot } from '@kubb/react'

const root = createRoot({ stdout: process.stdout })

/**
 * Create 2 files and write them to the file-system
 */
function Component() {
  const namesPath = path.resolve(__dirname, 'name.ts')
  const helloWorldPath = path.resolve(__dirname, 'result.ts')

  return (
    <>
      <File path={namesPath} baseName={'name.ts'}>
        <File.Source>
          <Const export asConst name={'name'}>
            "Lily"
          </Const>
        </File.Source>
      </File>

      <File path={helloWorldPath} baseName={'result.ts'}>
        <File.Import root={helloWorldPath} name={['name']} path={namesPath} />
        <File.Source>
          <Const name={'hello'}>name</Const>
        </File.Source>
      </File>
    </>
  )
}

async function start() {
  root.render(<Component />)
  console.log('\nFiles: ', root.files.length)
  await root.write()
}

start()
