/* eslint-disable no-restricted-globals */
/* eslint-disable consistent-return */
import { useEffect, useMemo, useRef } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { useAtom } from 'jotai'
import { Box, Button, Flex, Heading, useToast, HStack } from '@chakra-ui/react'
import { CgShare, CgFileDocument } from 'react-icons/cg'
import { Base64 } from 'js-base64'
import { gzip, ungzip } from 'pako'

import type { KubbUserConfig } from '@kubb/core'

import { codeAtom, configAtom } from '../state'
import { editorOptions, useBorderColor, useMonacoThemeValue } from '../utils'
import { versionAtom } from '../kubb'

import type { editor } from 'monaco-editor'
import type { TransformationResult } from '../kubb'

const STORAGE_KEY = 'v1.code'

function getIssueReportUrl({
  code,
  version,
  config,
  playgroundLink,
}: {
  code: string
  version: string
  config: KubbUserConfig
  playgroundLink: string
}): string {
  const reportUrl = new URL(`https://github.com/stijnvanhulle/kubb/issues/new?assignees=&labels=C-bug&template=bug_report.yml`)

  reportUrl.searchParams.set('code', code)
  reportUrl.searchParams.set('config', JSON.stringify(config, null, 2))
  reportUrl.searchParams.set('repro-link', playgroundLink)
  reportUrl.searchParams.set('version', version)

  return reportUrl.toString()
}

interface Props {
  output: TransformationResult
}

export default function InputEditor(_props: Props) {
  const [code, setCode] = useAtom(codeAtom)
  const [config] = useAtom(configAtom)
  const [version] = useAtom(versionAtom)
  const monacoTheme = useMonacoThemeValue()
  const borderColor = useBorderColor()
  const monaco = useMonaco()
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const toast = useToast()

  useEffect(() => {
    monaco?.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSyntaxValidation: true,
      noSemanticValidation: true,
      noSuggestionDiagnostics: true,
    })
  }, [monaco])

  useEffect(() => {
    const url = new URL(location.href)
    const encodedInput = url.searchParams.get('code')
    const storedInput = localStorage.getItem(STORAGE_KEY)
    if (encodedInput) {
      setCode(ungzip(Base64.toUint8Array(encodedInput), { to: 'string' }))
    } else if (storedInput) {
      setCode(storedInput)
    }
  }, [setCode])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, code)
  }, [code])

  const shareUrl = useMemo(() => {
    const url = new URL(location.href)
    url.searchParams.set('version', version)
    const encodedInput = Base64.fromUint8Array(gzip(code))
    url.searchParams.set('code', encodedInput)
    const encodedConfig = Base64.fromUint8Array(gzip(JSON.stringify(config)))
    url.searchParams.set('config', encodedConfig)
    return url.toString()
  }, [code, config, version])

  const issueReportUrl = useMemo(
    () =>
      getIssueReportUrl({
        code,
        config,
        version,
        playgroundLink: shareUrl,
      }),
    [code, config, version, shareUrl]
  )

  const handleIssueReportClick = () => {
    if (code.length > 2000) {
      toast({
        title: 'Code too long',
        description: 'Your input is too large to share. Please copy the code and paste it into the issue.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }
    window.open(issueReportUrl, '_blank')
  }

  const handleShare = async () => {
    if (!navigator.clipboard) {
      toast({
        title: 'Error',
        description: 'Clipboard is not supported in your environment.',
        status: 'error',
        duration: 3000,
        position: 'top',
        isClosable: true,
      })
      return
    }

    window.history.replaceState(null, '', shareUrl)
    await navigator.clipboard.writeText(shareUrl)
    toast({
      title: 'URL is copied to clipboard.',
      status: 'success',
      duration: 3000,
      position: 'top',
      isClosable: true,
    })
  }

  const handleEditorDidMount = (instance: editor.IStandaloneCodeEditor) => {
    editorRef.current = instance
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value != null) {
      setCode(value)
    }
  }

  const language = 'typescript'

  return (
    <Flex direction="column" gridArea="input" minW={0} minH={0}>
      <Flex justifyContent="space-between" alignItems="center">
        <Heading size="md" mb="8px">
          Input (JSON/YAML)
        </Heading>
        <HStack spacing="10px">
          <Button size="xs" leftIcon={<CgFileDocument />} onClick={handleIssueReportClick}>
            Report Issue
          </Button>
          <Button size="xs" leftIcon={<CgShare />} onClick={handleShare}>
            Share
          </Button>
        </HStack>
      </Flex>
      <Box width="full" height="full" borderColor={borderColor} borderWidth="1px">
        <Editor
          value={code}
          language={language}
          defaultLanguage={language}
          theme={monacoTheme}
          options={editorOptions}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
        />
      </Box>
    </Flex>
  )
}
