import { escapePointerToken } from '@internals/utils'
import { openapi } from '@readme/openapi-schemas'
import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js'
import type { Document, ServerObject } from '../types.ts'
import type { ValidationErrors } from './validateWorker.ts'

const MAX_ERRORS = 20

let validator: ValidateFunction | undefined

/** Pointers to every `servers` array: the document's, each path item's and each operation's. */
function serverLists(document: Document): Array<[string, Array<ServerObject>]> {
  const lists: Array<[string, unknown]> = [['', document.servers]]
  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    if (!pathItem || typeof pathItem !== 'object') continue
    const pointer = `/paths/${escapePointerToken(path)}`
    lists.push([pointer, pathItem.servers])
    for (const [method, operation] of Object.entries(pathItem)) {
      if (operation && typeof operation === 'object' && 'servers' in operation) lists.push([`${pointer}/${method}`, operation.servers])
    }
  }
  return lists.filter((entry): entry is [string, Array<ServerObject>] => Array.isArray(entry[1]))
}

function toMessage({ instancePath, keyword, message, params }: ErrorObject): string {
  if (keyword === 'false schema') return `${instancePath} is not allowed here`
  const property = (params as { unevaluatedProperty?: string; additionalProperty?: string }).unevaluatedProperty ?? params.additionalProperty
  return `${instancePath || '/'} ${message}${property === undefined ? '' : ` (${property})`}`
}

/**
 * Validates an OpenAPI 3.2 document against the official 3.2 JSON Schema, which `@readme/openapi-parser`
 * does not run yet, plus the server URL rule the schema leaves out. Only the deepest error per location is
 * kept, since its parents (`must match "else" schema`) say nothing more.
 */
export function validateOpenApi32(document: Document): { valid: true } | ({ valid: false } & ValidationErrors) {
  validator ??= new Ajv2020({ allErrors: true, strict: false, validateFormats: false }).compile(openapi.v32legacy)
  const schemaErrors = validator(document) ? [] : (validator.errors ?? [])
  const deepest = schemaErrors.filter((error) => !schemaErrors.some((other) => other.instancePath.startsWith(`${error.instancePath}/`)))

  const serverErrors = serverLists(document).flatMap(([pointer, servers]) =>
    servers.flatMap((server, index) =>
      typeof server?.url === 'string' && /[?#]/.test(server.url) ? [`${pointer}/servers/${index}/url must not contain a query or fragment`] : [],
    ),
  )
  const messages = [...new Set([...deepest.map(toMessage), ...serverErrors])]
  if (!messages.length) return { valid: true }

  return {
    valid: false,
    errors: messages.slice(0, MAX_ERRORS).map((message) => ({ message })),
    additionalErrors: Math.max(0, messages.length - MAX_ERRORS),
  }
}
