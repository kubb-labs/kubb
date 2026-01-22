
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'

type Props = {
  spinnerMessage?: string
  progress?: {
    current: number
    total: number
    message: string
  }
}

export const Status = ({ spinnerMessage, progress }: Props) => {
  if (progress) {
      return (
          <Box flexDirection="column">
              <Text>{progress.message}</Text>
              <Text color="green">
                 {'█'.repeat(Math.floor((progress.current / progress.total) * 20))}
                 {'░'.repeat(20 - Math.floor((progress.current / progress.total) * 20))}
                 {' '}{Math.floor((progress.current / progress.total) * 100)}%
              </Text>
          </Box>
      )
  }

  if (spinnerMessage) {
      return (
          <Box>
              <Text color="green"><Spinner type="dots" /> </Text>
              <Text>{spinnerMessage}</Text>
          </Box>
      )
  }

  return null
}
