/* eslint-disable no-undef */
import { useEffect, useMemo } from 'react'
import { useAtom } from 'jotai'
import useSWRMutation from 'swr/mutation'
import useSWR from 'swr'
import { Center, CircularProgress, useToast, VStack } from '@chakra-ui/react'
import styled from '@emotion/styled'
import { loader } from '@monaco-editor/react'
import { Err } from 'ts-results'

import type { File } from '@kubb/core'

import Configuration from './Configuration'
import VersionSelect from './VersionSelect'
import InputEditor from './InputEditor'
import OutputEditor from './OutputEditor'

import { format } from '../format'
import { fileNameAtom, versionAtom } from '../kubb'
import { codeAtom, configAtom } from '../state'

import type { TransformationResult } from '../kubb'

const Main = styled.main`
  display: grid;
  padding: 1em;
  gap: 1em;

  grid-template-columns: 1fr;
  grid-template-rows: repeat(3, 1fr);
  grid-template-areas: 'sidebar' 'input' 'output';

  min-height: 88vh;

  @media screen and (min-width: 600px) {
    grid-template-columns: 256px 1fr;
    grid-template-rows: repeat(2, 1fr);
    grid-template-areas: 'sidebar input' 'sidebar output';

    min-height: calc(100vh - 80px);
  }

  @media screen and (min-width: 1200px) {
    grid-template-columns: 256px repeat(2, 1fr);
    grid-template-rows: 1fr;
    grid-template-areas: 'sidebar input output';

    min-height: calc(100vh - 80px);
  }
`

const fetchOutput = async (url: string, { arg }) => {
  const file = await fetch(`/api/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: arg.input }),
  }).then(async (response) => {
    const json = await response.json()
    if (response.status === 500) {
      throw json.error
    }

    return json as { url: string }
  })

  return fetch(`/api/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: file.url,
      config:
        arg.config && file.url
          ? {
              ...arg.config,
              input: {
                path: file.url,
              },
            }
          : arg.config,
    }),
  }).then(async (response) => {
    const json = await response.json()
    if (response.status === 500) {
      throw json.error
    }

    const files: File[] = json
      .map((file) => {
        return { ...file, path: file.path.split('/gen/')[1] }
      })
      .filter((file) => file.path)
      .reduce((acc, file) => {
        if (!acc.find((item) => item.path === file.path)) {
          return [...acc, file]
        }
        return acc
      }, [] as File[])

    return files
  })
}

// interface KubbModule {
//   default(): Promise<unknown>
//   build: any
// }

// export async function loadKubbCore(version?: string): Promise<KubbModule> {
//   const build: KubbModule = await import(
//     /* webpackIgnore: true */
//     'https://cdn.jsdelivr.net/npm/@kubb/core@0.37.18/dist/index.global.js'
//   )

//   console.log({ build })

//   await build()

//   return build
// }

export default function Workspace() {
  const { data: monaco } = useSWR('monaco', () => loader.init())
  // const d = useSWR('load', () => loadKubbCore())
  const [version] = useAtom(versionAtom)
  const [fileName] = useAtom(fileNameAtom)
  const { trigger, isMutating, data: files, error } = useSWRMutation(`/api/parse`, fetchOutput)
  const [code] = useAtom(codeAtom)
  const [config] = useAtom(configAtom)

  useEffect(() => {
    if (code) {
      trigger({ input: code, config })
    }
  }, [code, config])

  const output = useMemo(() => {
    if (error) {
      return Err(String(error))
    }

    if (isMutating) {
      return Err('Loading Kubb...')
    }
    const code = files?.find((file) => file.fileName === fileName)?.source || ''
    let language = 'text'

    if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
      language = 'javascript'
    } else if (fileName.endsWith('.json')) {
      language = 'json'
    }

    return {
      val: {
        code: format(code),
        fileName,
        language,
      },
    } as unknown as TransformationResult
  }, [code, isMutating, files, fileName, error, config])
  const toast = useToast()

  useEffect(() => {
    if (error) {
      toast({
        title: 'Failed to load Kubb.',
        description: String(error),
        status: 'error',
        duration: 5000,
        position: 'top',
        isClosable: true,
      })
    }
  }, [error, toast])

  const isLoadingMonaco = !monaco
  if (isLoadingMonaco && !files) {
    return (
      <Center width="full" height="88vh" display="flex" flexDirection="column">
        <CircularProgress isIndeterminate mb="3" />
        <div>
          Loading Kubb {version}
          {isLoadingMonaco && ' and editor'}...
        </div>
      </Center>
    )
  }

  return (
    <Main>
      <VStack spacing={4} alignItems="unset" gridArea="sidebar">
        <Configuration />
        <VersionSelect isLoading={isMutating} />
      </VStack>
      <InputEditor output={output} />
      <OutputEditor files={files} output={output} />
    </Main>
  )
}
