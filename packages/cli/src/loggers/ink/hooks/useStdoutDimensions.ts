import { useState, useEffect } from 'react'
import { useStdout } from 'ink'

export const useStdoutDimensions = () => {
  const { stdout } = useStdout()
  const [dimensions, setDimensions] = useState({
    columns: stdout?.columns ?? 80,
    rows: stdout?.rows ?? 24,
  })

  useEffect(() => {
    if (!stdout) return

    const handler = () => {
      setDimensions({
        columns: stdout.columns,
        rows: stdout.rows,
      })
    }

    stdout.on('resize', handler)
    return () => {
      stdout.off('resize', handler)
    }
  }, [stdout])

  return dimensions
}
