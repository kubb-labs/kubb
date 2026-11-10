import type { ast } from '@kubb/kit'
import { getExternalDocs } from '../oas.ts'
import type { TagObject } from '../types.ts'

export function toInputTags(tags: Array<TagObject>): Array<ast.InputTag> {
  return tags
    .filter((tag) => typeof tag.name === 'string')
    .map(({ name, summary, description, parent, kind, externalDocs }) => {
      const docs = getExternalDocs(externalDocs)
      return {
        name,
        ...(typeof summary === 'string' && { summary }),
        ...(typeof description === 'string' && { description }),
        ...(typeof parent === 'string' && { parent }),
        ...(typeof kind === 'string' && { kind }),
        ...(docs && { externalDocs: docs }),
      }
    })
}
