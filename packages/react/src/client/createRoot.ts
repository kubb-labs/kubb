import { createNode, ReactTemplate } from '../shared/index.ts'

import type { Logger } from '@kubb/core'
import type { AppContextProps } from '../components/AppContext.tsx'
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
    get imports() {
      return instance.imports
    },
    get exports() {
      return instance.exports
    },
    get file() {
      return instance.file
    },
  }
}
