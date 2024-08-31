import process from 'node:process'
import { useContext, useEffect, useState } from 'react'
import { Const } from './components/Const.tsx'
import { RootContext } from './components/Root.tsx'
import { createRoot } from './createRoot'

const root = createRoot({ debug: true })

function Component() {
  const max = 30
  const [counter, setCounter] = useState(0)
  const { exit } = useContext(RootContext)

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter((previousCounter) => {
        return previousCounter + 1
      })
    }, 10000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  if (max === counter) {
    // trigger unmount
    exit()
  }

  return <Const name={`test ${counter}`}>fdsfs</Const>
}

root.render(<Component />)

// keep alive
// process.stdout.resume()
