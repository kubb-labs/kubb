import type { ast } from '@kubb/kit'
import { getExternalDocs } from '../oas.ts'
import type { TagObject } from '../types.ts'

/** Maps OpenAPI tags to `InputTag` entries, keeping the OpenAPI 3.2 `summary`, `parent` and `kind`. Drops entries without a `name`. */
export function toInputTags(tags: Array<TagObject>): Array<ast.InputTag> {
  return tags
    .filter((tag) => typeof tag.name === 'string')
    .map(({ name, summary, description, parent, kind, externalDocs }) => ({
      name,
      ...(typeof summary === 'string' && { summary }),
      ...(typeof description === 'string' && { description }),
      ...(typeof parent === 'string' && { parent }),
      ...(typeof kind === 'string' && { kind }),
      ...(getExternalDocs(externalDocs) && { externalDocs: getExternalDocs(externalDocs) }),
    }))
}
