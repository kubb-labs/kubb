import process from 'node:process'
import { useEffect, useState } from '@kubb/react'

import path from 'node:path'
import { Const, File, Function, createRoot, useLifecycle } from '@kubb/react'

const root = createRoot({ stdout: process.stdout })

const fetchNames = async (): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(['Lily', 'Jan'])
    }, 2000)
  })
}

/**
 * Create a file and append data based on a promise
 */
function Component() {
  const [names, setNames] = useState<string[]>([])
  const { exit } = useLifecycle()

  useEffect(() => {
    fetchNames().then((newNames) => {
      setNames(newNames)
      exit()
    })
  }, [exit])

  return (
    <File path={path.resolve(__dirname, 'result.ts')} baseName={'result.ts'}>
      <File.Source>
        <Const name={'names'}>"{names.join(' and ')}"</Const>
        <br />
        <Function.Arrow name={'getNames'} export singleLine>
          names
        </Function.Arrow>
        <Function.Arrow name={'getFirstChar'} export>
          return names.charAt(0)
        </Function.Arrow>
        <br />
        <Function
          name={'getNamesTyped'}
          export
          returnType={'TNames'}
          JSDoc={{
            comments: ['Returns the names'],
          }}
          generics={['TNames extends string']}
        >
          return names as TNames
        </Function>
      </File.Source>
    </File>
  )
}

async function start() {
  root.render(<Component />)

  await root.waitUntilExit()
  console.log('\nFiles: ', root.files.length)
  await root.write()
}

start()
