import type {
  FromSchema,
  JSONSchema,
} from 'json-schema-to-ts'
import type { OASDocument } from 'oas/rmoas.types'

export type Model<
  TOAS extends OASDocument,
  TName extends TOAS extends {
    components: {
      schemas: Record<string, JSONSchema>
    }
  } ? keyof TOAS['components']['schemas']
    : TOAS extends {
      definitions: Record<string, JSONSchema>
    } ? keyof TOAS['definitions']
    : never,
> = TOAS extends {
  components: {
    schemas: {
      [TModelName in TName]: JSONSchema
    }
  }
} ? FromSchema<TOAS['components']['schemas'][TName]>
  : TOAS extends {
    definitions: {
      [TModelName in TName]: JSONSchema
    }
  } ? FromSchema<TOAS['definitions'][TName]>
  : never
