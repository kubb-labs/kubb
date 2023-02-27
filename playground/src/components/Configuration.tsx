/* eslint-disable no-restricted-globals */
import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { Flex, FormControl, FormLabel, Heading, Select, VStack } from '@chakra-ui/react'
import { Base64 } from 'js-base64'
import { ungzip } from 'pako'
import * as React from 'react'

import ConfigEditorModal from './ConfigEditorModal'

import { configAtom } from '../state'
import { useBgColor, useBorderColor } from '../utils'

const STORAGE_KEY = 'v1.config'

export default function Configuration() {
  const [config, setConfig] = useAtom(configAtom)
  const bg = useBgColor()
  const borderColor = useBorderColor()

  useEffect(() => {
    const url = new URL(location.href)
    const encodedConfig = url.searchParams.get('config')
    const storedConfig = localStorage.getItem(STORAGE_KEY)
    if (encodedConfig) {
      setConfig(JSON.parse(ungzip(Base64.toUint8Array(encodedConfig), { to: 'string' })))
    } else if (storedConfig) {
      setConfig(JSON.parse(storedConfig))
    }
  }, [setConfig])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  const handleLogLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setConfig((config) => {
      return {
        ...config,
        logLevel: event.target.value as any,
      }
    })
  }

  return (
    <Flex direction="column">
      <Heading size="md" mb="8px">
        Configuration
      </Heading>
      <Flex direction="column" p="2" bg={bg} borderColor={borderColor} borderWidth="1px">
        <VStack spacing="2">
          <FormControl>
            <FormLabel htmlFor="logLevel">LogLevel</FormLabel>
            <Select disabled id="logLevel" value={config.logLevel} onInput={handleLogLevelChange}>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </Select>
          </FormControl>
        </VStack>
        <ConfigEditorModal />
      </Flex>
    </Flex>
  )
}
