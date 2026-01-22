
import { Box, Text } from 'ink'

type Props = {
  logs: string[]
  maxHeight?: number
}

export const LogWindow = ({ logs, maxHeight = 10 }: Props) => {
  const visibleLogs = logs.slice(-maxHeight)

  // Ensure we always take up the fixed height
  const emptyLines = Math.max(0, maxHeight - visibleLogs.length)

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" title="Logs" height={maxHeight + 2}>
        {visibleLogs.map((log, index) => (
            <Text key={index} wrap="truncate-end">{log}</Text>
        ))}
        {Array.from({ length: emptyLines }).map((_, i) => (
            <Text key={`empty-${i}`}> </Text>
        ))}
    </Box>
  )
}
