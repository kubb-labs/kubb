import { ReactTemplate } from '../shared/ReactTemplate.tsx'
import { createNode } from '../shared/dom.ts'

import type { Logger } from '@kubb/core/logger'
import type * as KubbFile from '@kubb/fs/types'
import type { ReactNode } from 'react'
import type { RootContextProps } from '../components/Root.tsx'
import type { DOMElement } from '../types.ts'

type RootType<T = unknown> = {
  render(children: ReactNode, context?: T): void
  unmount(): void
  output: string
  files: Array<KubbFile.File>
}

const instances = new Map<string, ReactTemplate>()

type Props = {
  container?: DOMElement
  logger?: Logger
}

export function createRoot<Context extends RootContextProps = RootContextProps>({ container, logger }: Props = {}): RootType<Context> {
  if (!container) {
    container = createNode('kubb-root')
  }

  const instance = new ReactTemplate<Context>(container, { logger })
  instances.set(instance.id, instance)

  return {
    render(children, context?: Context) {
      instance.render(children, context)
    },
    unmount() {
      instance.unmount()
      instances.delete(instance.id)
    },
    get output() {
      return instance.output
    },
    get files() {
      return instance.files
    },
  }
}
