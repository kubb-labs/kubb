import { default as gradientString } from 'gradient-string'
import { Box, Newline, Text, Transform } from 'ink'
import { useEffect, useState } from 'react'
import { version } from '../../../../package.json'
import { getIntro } from '../../../utils/getIntro.ts'

type Props = {
  projectName?: string
}

export const Header = ({ projectName }: Props) => {
  const [areEyesOpen, setAreEyesOpen] = useState(true)

  useEffect(() => {
    // Simple blinking mechanism
    const timer = setInterval(() => {
      setAreEyesOpen(false)
      setTimeout(() => setAreEyesOpen(true), 150)
    }, 2000)

    return () => clearInterval(timer)
  }, [])

  const intro = getIntro({
    areEyesOpen,
  })

  return (
    <Box flexDirection="row" alignItems={'flex-start'}>
      <Box>
        <Text>{intro}</Text>
      </Box>
      <Box alignSelf={'flex-start'} flexDirection={'column'} justifyContent="space-evenly">
        <Newline />
        <Transform transform={(output) => gradientString(['#F58517', '#F5A217', '#F55A17'])(output)}>
          <Text>Kubb v{version}</Text>
        </Transform>
        <Text color={'gray'} dimColor>
          {projectName}
        </Text>
      </Box>
    </Box>
  )
}
