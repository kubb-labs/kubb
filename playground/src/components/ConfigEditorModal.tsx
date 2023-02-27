import { useEffect, useState } from 'react'
import {
  Button,
  Code,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { useAtom } from 'jotai'

import { editorOptions as sharedEditorOptions, useMonacoThemeValue } from '../utils'
import { configAtom } from '../state'
import { configSchema } from '../kubb'

import type { editor } from 'monaco-editor'

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  ...sharedEditorOptions,
  scrollBeyondLastLine: false,
}

export default function ConfigEditorModal() {
  const [config, setConfig] = useAtom(configAtom)
  const [editingConfig, setEditingConfig] = useState(JSON.stringify(config, null, 2))
  const monacoTheme = useMonacoThemeValue()
  const monaco = useMonaco()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  useEffect(() => {
    if (!monaco) {
      return
    }

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      schemas: [
        {
          uri: 'http://server/kubb-schema.json',
          fileMatch: ['.kubbrc'],
          schema: configSchema,
        },
      ],
    })
  }, [monaco])

  const handleOpen = () => {
    setEditingConfig(JSON.stringify(config, null, 2))
    onOpen()
  }

  const handleClose = () => {
    setEditingConfig(JSON.stringify(config, null, 2))
    onClose()
  }

  const handleApply = () => {
    try {
      setConfig(JSON.parse(editingConfig))
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: String(error),
        status: 'error',
        duration: 5000,
        position: 'top',
        isClosable: true,
      })
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value != null) {
      setEditingConfig(value)
    }
  }

  return (
    <>
      <Button mt="3" onClick={handleOpen}>
        Edit as JSON
      </Button>
      <Modal size="3xl" isCentered isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Kubb Configuration (<Code>.kubbrc</Code>)
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Text mb="4">You can paste your config here, or just manually type directly.</Text>
            <Editor
              value={editingConfig}
              defaultLanguage="json"
              path=".kubbrc"
              options={editorOptions}
              theme={monacoTheme}
              height="40vh"
              onChange={handleEditorChange}
            />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleApply}>
              Apply
            </Button>
            <Button onClick={handleClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
