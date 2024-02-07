import { createNode } from '../shared/dom.ts'
import { ReactTemplate } from '../shared/ReactTemplate.tsx'

import type { Logger } from '@kubb/core/logger'
import type { AppContextProps } from '../components/AppContext.ts'
import type { DOMElement } from '../types.ts'
import type { RootType } from './types.ts'

const instances = new Map<string, ReactTemplate>()

type Props = {
  container?: DOMElement
  logger?: Logger
}

export function createRoot<Context extends AppContextProps = AppContextProps>({ container, logger }: Props = {}): RootType<Context> {
  if (!container) {
    container = createNode('kubb-root')
  }

  const instance = new ReactTemplate<Context>(container, { logger })
  instances.set(instance.id, instance)

  return {
    render(children, context?: Context) {
      return instance.render(children, context)
    },
    unmount() {
      instance.unmount()
      instances.delete(instance.id)
    },
    get output() {
      return instance.output
    },
    get file() {
      return instance.file
    },
    get files() {
      return instance.files
    },
    getFile(id: string) {
      return instance.files.find(file => file.id === id)
    },
  }
}
