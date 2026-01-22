import { type LoggerContext, LogLevel } from '@kubb/core'

import { Box, Text, useApp } from 'ink'

import { useLayoutEffect, useRef, useState } from 'react'
import { getSummary } from '../../utils/getSummary.ts'
import { Header } from './components/Header.tsx'

type Props = {
  context: LoggerContext
  logLevel: (typeof LogLevel)[keyof typeof LogLevel]
}

export const InkLogger = ({ context, logLevel }: Props) => {
  const { exit } = useApp()

  const [projectName, _setProjectName] = useState<string | undefined>()
  const [summary, setSummary] = useState<string[] | undefined>()
  const [hasError, setHasError] = useState(false)

  // Ref to keep track of current props/state in async callbacks if needed
  const logLevelRef = useRef(logLevel)
  logLevelRef.current = logLevel

  useLayoutEffect(() => {
    context.on('generation:summary', (config: any, { pluginTimings, status, hrStart, failedPlugins, filesCreated }: any) => {
      const summaryLines = getSummary({
        failedPlugins,
        filesCreated,
        config,
        status,
        hrStart,
        pluginTimings: logLevelRef.current >= LogLevel.verbose ? pluginTimings : undefined,
      })

      setSummary(summaryLines)
      setHasError(status !== 'success')

      setTimeout(() => {
        exit()
      }, 0)
    })
  }, [context, exit])

  return (
    <Box flexDirection="column" padding={1}>
      <Header projectName={projectName} />
      {summary && (
        <Box width={50} flexDirection="column" borderStyle="round" borderColor={hasError ? 'red' : 'green'} paddingX={2} paddingY={1}>
          {summary.map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </Box>
      )}
    </Box>
  )
}
