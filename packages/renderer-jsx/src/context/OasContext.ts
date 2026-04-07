import { createContext } from '@internals/utils'

/**
 * Context key for the OAS (OpenAPI Specification) instance.
 * Use `provide`/`unprovide` from `@internals/utils` around render calls,
 * and `inject` inside generator components.
 */
export const OasContext = createContext<unknown>(null)
