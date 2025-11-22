import { usePluginManager } from '@kubb/core/hooks'
import { camelCase } from '@kubb/core/transformers'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { Operation } from '@kubb/oas'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { File } from '@kubb/react-fabric'
import { ClassClient } from '../components/ClassClient'
import type { PluginClient } from '../types'

export const classClientGenerator = createReactGenerator<PluginClient>({
  name: 'classClient',
  Operations({ operations, generator, plugin, config }) {
    const { options, key: pluginKey } = plugin
    const pluginManager = usePluginManager()

    const oas = useOas()
    const { getGroup } = useOperationManager(generator)

    // Group operations by tag if group option is set
    if (options.group?.type === 'tag') {
      const controllers = operations.reduce(
        (acc, operation) => {
          const group = getGroup(operation)
          const defaultName = group?.tag ? `${camelCase(group.tag)}Client` : 'ApiClient'
          const name = options.className
            ? typeof options.className === 'function'
              ? options.className({ group: group?.tag })
              : options.className
            : defaultName

          if (!group?.tag) {
            return acc
          }

          const file = pluginManager.getFile({
            name,
            extname: '.ts',
            pluginKey,
            options: { group },
          })

          const previousController = acc.find((item) => item.file.path === file.path)

          if (previousController) {
            previousController.operations.push(operation)
          } else {
            acc.push({ name, file, operations: [operation] })
          }

          return acc
        },
        [] as Array<{ name: string; file: KubbFile.File; operations: Array<Operation> }>,
      )

      return controllers.map(({ name, file, operations: groupedOperations }) => (
        <File
          key={file.path}
          baseName={file.baseName}
          path={file.path}
          meta={file.meta}
          banner={getBanner({ oas, output: options.output, config: pluginManager.config })}
          footer={getFooter({ oas, output: options.output })}
        >
          <ClassClient name={name} operations={groupedOperations} plugin={plugin} config={config} generator={generator} />
        </File>
      ))
    }

    // Single class for all operations
    const defaultName = 'ApiClient'
    const name = options.className
      ? typeof options.className === 'function'
        ? options.className({})
        : options.className
      : defaultName

    const file = pluginManager.getFile({
      name,
      extname: '.ts',
      pluginKey,
    })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({ oas, output: options.output, config: pluginManager.config })}
        footer={getFooter({ oas, output: options.output })}
      >
        <ClassClient name={name} operations={operations} plugin={plugin} config={config} generator={generator} />
      </File>
    )
  },
})
