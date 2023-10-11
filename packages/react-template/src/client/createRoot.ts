import { createNode } from './dom.ts'
import { ReactTemplate } from './ReactTemplate.tsx'

import type { AppContextProps } from '../components/AppContext.tsx'
import type { DOMElement } from '../types.ts'
import type { RootType } from './types'

const instances = new Map<string, ReactTemplate>()

export function createRoot<Context extends AppContextProps = AppContextProps>(container?: DOMElement): RootType<Context> {
  if (!container) {
    container = createNode('kubb-root')
  }

  const instance = new ReactTemplate<Context>(container)
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
  }
}
