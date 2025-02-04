import { ReactTemplate, type ReactTemplateOptions } from './ReactTemplate.tsx'

export function createRoot(options: ReactTemplateOptions = { debug: false }): ReactTemplate {
  return new ReactTemplate(options)
}
