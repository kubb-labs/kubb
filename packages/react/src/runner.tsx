import { Const } from './components/Text'
import { createRoot } from './createRoot'
import process from 'node:process'
import { useContext, useEffect, useState } from 'react'
import { RootContext } from './components/Root.tsx';

const root = createRoot({ debug: true })

function Component() {
  const max = 30
  const [counter, setCounter] = useState(0)
  const { exit } = useContext(RootContext)

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCounter((previousCounter) => {
  //       return previousCounter + 1
  //     })
  //   }, 100)
  //
  //   return () => {
  //     clearInterval(timer)
  //   }
  // }, [])

  if (max === counter) {
    // exit()
    // trigger unmount
  }

  return <Const name={`test ${counter}`}>fdsfs</Const>
}

root.render(<Component />)

// keep alive
process.stdout.resume()
