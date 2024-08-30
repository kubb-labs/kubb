import { ReactTemplate, type ReactTemplateOptions } from './shared/ReactTemplate.tsx'

import type { RootContextProps } from './components/Root.tsx'

export function createRoot<Context extends RootContextProps = RootContextProps>(options: ReactTemplateOptions): ReactTemplate<Context> {
  return new ReactTemplate<Context>(options)
}
