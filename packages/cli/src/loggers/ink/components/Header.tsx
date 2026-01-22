import { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { version } from '../../../../package.json'
import { getIntro } from '../../../utils/getIntro.ts'

type Props = {
  projectName?: string
  spinnerMessage?: string
  progress?: {
    current: number
    total: number
    message: string
  }
}

export const Header = ({ projectName, spinnerMessage, progress }: Props) => {
  const [areEyesOpen, setAreEyesOpen] = useState(true)

  useEffect(() => {
    // Simple blinking mechanism
    const timer = setInterval(() => {
      setAreEyesOpen(false)
      setTimeout(() => setAreEyesOpen(true), 150)
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  const intro = getIntro({
    title: 'The ultimate toolkit for working with APIs',
    description: spinnerMessage || (projectName ? `Project: ${projectName}` : 'Ready to start'),
    version,
    areEyesOpen,
  })

  return (
    <Box flexDirection="column">
        <Text>{intro}</Text>
        {progress && (
            <Box flexDirection="column" paddingLeft={2}>
                <Text>{progress.message}</Text>
                <Text color="green">
                    {'█'.repeat(Math.floor((progress.current / progress.total) * 40))}
                    {'░'.repeat(40 - Math.floor((progress.current / progress.total) * 40))}
                    {' '}{Math.floor((progress.current / progress.total) * 100)}%
                </Text>
            </Box>
        )}
    </Box>
  )
}
