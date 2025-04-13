import { useEffect, useRef, useState } from '@kubb/react'

import { Text, createRoot, useLifecycle } from '@kubb/react'

// attach node stdout with Kubb's internal one
const root = createRoot({ stdout: process.stdout })

/**
 * Render component that will count down from 5
 */
function Component() {
  const timer = useRef<NodeJS.Timer>(null)
  const [counter, setCounter] = useState(5)
  const { exit } = useLifecycle()

  useEffect(() => {
    timer.current = setInterval(() => {
      setCounter((previousCounter) => {
        return previousCounter - 1
      })
    }, 1000)

    return () => {
      clearInterval(timer.current!)
    }
  }, [])

  useEffect(() => {
    if (counter === 0) {
      // trigger unmount
      exit()
      clearInterval(timer.current!)
    }
  }, [counter, exit])

  if (counter === 0) {
    return <Text indentSize={2}>Finished</Text>
  }

  return <Text>Counter: {counter}</Text>
}

root.render(<Component />)
