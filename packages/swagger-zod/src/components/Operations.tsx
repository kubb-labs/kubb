import { useOperationManager, useOperations } from '@kubb/plugin-oas/hooks'
import { Const, File, Parser, useApp } from '@kubb/react'

import transformers from '@kubb/core/transformers'
import type { HttpMethod, Operation } from '@kubb/oas'
import type { KubbNode } from '@kubb/react'
import type { ComponentProps, ComponentType } from 'react'
import type { FileMeta, PluginZod } from '../types.ts'

type TemplateProps = {
  /**
   * Name of the function
   */
  operationsName: string
  /**
   * Name of the function
   */
  pathsName: string
  operations: Operation[]
}

function Template({ operationsName, pathsName, operations }: TemplateProps): KubbNode {
  const { groupSchemasByName } = useOperationManager()
  const transformedOperations = operations.map((operation) => ({ operation, data: groupSchemasByName(operation, { type: 'function' }) }))

  const operationsJSON = transformedOperations.reduce(
    (prev, acc) => {
      prev[`"${acc.operation.getOperationId()}"`] = acc.data

      return prev
    },
    {} as Record<string, unknown>,
  )

  const pathsJSON = transformedOperations.reduce(
    (prev, acc) => {
      prev[`"${acc.operation.path}"`] = {
        ...(prev[`"${acc.operation.path}"`] || ({} as Record<HttpMethod, string>)),
        [acc.operation.method]: `operations["${acc.operation.getOperationId()}"]`,
      }

      return prev
    },
    {} as Record<string, Record<HttpMethod, string>>,
  )

  return (
    <>
      <Const export name={operationsName} asConst>
        {`{${transformers.stringifyObject(operationsJSON)}}`}
      </Const>
      <Const export name={pathsName} asConst>
        {`{${transformers.stringifyObject(pathsJSON)}}`}
      </Const>
    </>
  )
}

type RootTemplateProps = {
  children?: React.ReactNode
}

function RootTemplate({ children }: RootTemplateProps) {
  const {
    mode,
    pluginManager,
    plugin: {
      key: pluginKey,
      options: { extName },
    },
  } = useApp<PluginZod>()
  const { getFile } = useOperationManager()
  const operations = useOperations()
  const { groupSchemasByName } = useOperationManager()
  const transformedOperations = operations.map((operation) => ({ operation, data: groupSchemasByName(operation, { type: 'function' }) }))

  const file = pluginManager.getFile({ name: 'operations', extName: '.ts', pluginKey })
  const imports = Object.entries(transformedOperations)
    .map(([_key, { data, operation }], index) => {
      const names = [data.request, ...Object.values(data.responses), ...Object.values(data.parameters)].filter(Boolean)

      return <File.Import key={index} extName={extName} name={names} root={file.path} path={getFile(operation).path} />
    })
    .filter(Boolean)

  return (
    <Parser language="typescript">
      <File<FileMeta> baseName={file.baseName} path={file.path} meta={file.meta} exportable={false}>
        {mode === 'split' && imports}
        <File.Source>{children}</File.Source>
      </File>
    </Parser>
  )
}

const defaultTemplates = { default: Template, root: RootTemplate } as const

type Templates = Partial<typeof defaultTemplates>

type Props = {
  /**
   * This will make it possible to override the default behaviour.
   */
  Template?: ComponentType<ComponentProps<typeof Template>>
}

export function Operations({ Template = defaultTemplates.default }: Props): KubbNode {
  const operations = useOperations()

  return <Template operationsName="operations" pathsName="paths" operations={operations} />
}

type FileProps = {
  /**
   * This will make it possible to override the default behaviour.
   */
  templates?: Templates
}

Operations.File = function (props: FileProps): KubbNode {
  const templates = { ...defaultTemplates, ...props.templates }

  const Template = templates.default
  const RootTemplate = templates.root

  return (
    <RootTemplate>
      <Operations Template={Template} />
    </RootTemplate>
  )
}

Operations.templates = defaultTemplates
