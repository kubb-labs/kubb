import { ReactTemplate } from '../shared/ReactTemplate.tsx'
import { createNode } from '../shared/dom.ts'
import { format } from './format.ts'

import type { Logger } from '@kubb/core/logger'
import type { RootContextProps } from '../components/Root.tsx'
import type { DOMElement } from '../types.ts'
import type { RootType } from './types.ts'

const instances = new Map<string, ReactTemplate>()

type Props = {
  container?: DOMElement
  logger?: Logger
}

export function createRootServer<Context extends RootContextProps = RootContextProps>({ container, logger }: Props): RootType<Context> {
  if (!container) {
    container = createNode('kubb-root')
  }

  const instance = new ReactTemplate<Context>(container, { logger })
  instances.set(instance.id, instance)

  return {
    renderToString(children, context?: Context) {
      instance.render(children, context)
      return format(instance.output)
    },
    unmount() {
      instance.unmount()
      instances.delete(instance.id)
    },
    get files() {
      return instance.files
    },
    getFile(id: string) {
      return instance.files.find((file) => file.id === id)
    },
  }
}
