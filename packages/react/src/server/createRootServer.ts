import { ReactTemplate } from '../shared/ReactTemplate.tsx'
import { createNode } from '../shared/dom.ts'

import type { Logger } from '@kubb/core/logger'
import type * as KubbFile from '@kubb/fs/types'
import type { ReactNode } from 'react'
import type { RootContextProps } from '../components/Root.tsx'
import type { DOMElement } from '../types.ts'

type RootType<T = unknown> = {
  renderToString(children: ReactNode, context?: T): Promise<string> | string
  unmount(): void
  files: Array<KubbFile.File>
}

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
      return instance.output
    },
    unmount() {
      instance.unmount()
      instances.delete(instance.id)
    },
    get files() {
      return instance.files
    },
  }
}
