import { type OperationSchema as OperationSchemaType, SchemaGenerator, createReactGenerator } from '@kubb/plugin-oas'
import { Operations, OperationSchema, Schema } from '../components'
import type { PluginZod } from '../types'
import {File, useApp} from "@kubb/react";
import {useSchemaManager} from "@kubb/plugin-oas/hooks";
import {pluginZodName} from "../plugin.ts";
import {pluginTsName} from "@kubb/plugin-ts";

export const zodGenerator = createReactGenerator<PluginZod>({
  name: 'plugin-zod',
  Operations({ options }) {
    if (!options.operations) {
      return null
    }

    return <Operations.File />
  },
  Operation() {
    return <OperationSchema.File />
  },
  Schema({ schema, name, tree }) {
    const {
      pluginManager,
      plugin: {
        options: {infer, typed,  mapper, importPath },
      },
      mode,
    } = useApp<PluginZod>()
    const { getFile, getImports } = useSchemaManager()

    const file = getFile(name)
    const imports = getImports(tree)

    const resolvedName = pluginManager.resolveName({
      name,
      pluginKey: [pluginZodName],
      type: 'function',
    })

    // used for this.options.typed
    const typedName = pluginManager.resolveName({
      name,
      pluginKey: [pluginTsName],
      type: 'type',
    })

    const typedBaseName = pluginManager.resolveName({
      name: name,
      pluginKey: [pluginTsName],
      type: 'file',
    })

    const typedPath = pluginManager.resolvePath({
      baseName: typedBaseName,
      pluginKey: [pluginTsName],
    })


    const inferTypedName = pluginManager.resolveName({
      name,
      pluginKey: [pluginZodName],
      type: 'type',
    })

    return (
      <File baseName={file.baseName} path={file.path} meta={file.meta}>
        <File.Import name={['z']} path={importPath} />
        {typed && typedName && typedPath && <File.Import isTypeOnly root={file.path} path={typedPath} name={[typedName]} />}

        {mode === 'split' && imports.map((imp, index) => <File.Import key={index} root={file.path} path={imp.path} name={imp.name} />)}
        <Schema
          name={resolvedName}
          typedName={typed? typedName: undefined}
          inferTypedName={infer? inferTypedName: undefined}
          description={schema.description}
          tree={tree}
          mapper={mapper}
        />
      </File>
    )
  },
})
