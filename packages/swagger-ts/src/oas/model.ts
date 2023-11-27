/* eslint-disable @typescript-eslint/no-namespace */
import type { OasTypes } from '@kubb/swagger'
import type {
  FromSchema,
  JSONSchema,
} from 'json-schema-to-ts'

namespace Checks {
  export type ModelWithSchemas = {
    components: {
      schemas: Record<string, JSONSchema>
    }
  }
  export type ModelWithSchemasNamed<TName extends string | number | symbol> = {
    components: {
      schemas: {
        [TModelName in TName]: JSONSchema
      }
    }
  }
  export type ModelWithDefinitions = {
    definitions: Record<string, JSONSchema>
  }
  export type ModelWithDefinitionsNamed<TName extends string | number | symbol = never> = {
    definitions: {
      [TModelName in TName]: JSONSchema
    }
  }
}

export type Model<
  TOAS extends OasTypes.OASDocument,
  TName extends TOAS extends Checks.ModelWithSchemas ? keyof TOAS['components']['schemas']
    : TOAS extends Checks.ModelWithDefinitions ? keyof TOAS['definitions']
    : never,
> = TOAS extends Checks.ModelWithSchemasNamed<TName> ? FromSchema<TOAS['components']['schemas'][TName]>
  : TOAS extends Checks.ModelWithDefinitionsNamed<TName> ? FromSchema<TOAS['definitions'][TName]>
  : never
