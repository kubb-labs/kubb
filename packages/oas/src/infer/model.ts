import type { FromSchema, JSONSchema } from 'json-schema-to-ts'
import type { OasTypes } from '../types.ts'

type Checks<TName extends string | number | symbol = never> = {
  ModelWithSchemas: {
    components: {
      schemas: Record<string, JSONSchema>
    }
  }
  ModelWithSchemasNamed: {
    components: {
      schemas: {
        [TModelName in TName]: JSONSchema
      }
    }
  }
  ModelWithDefinitions: {
    definitions: Record<string, JSONSchema>
  }
  ModelWithDefinitionsNamed: {
    definitions: {
      [TModelName in TName]: JSONSchema
    }
  }
}

export type Model<
  TOAS extends OasTypes.OASDocument,
  TName extends TOAS extends Checks['ModelWithSchemas']
    ? keyof TOAS['components']['schemas']
    : TOAS extends Checks['ModelWithDefinitions']
      ? keyof TOAS['definitions']
      : never,
> = TOAS extends Checks<TName>['ModelWithSchemasNamed']
  ? FromSchema<TOAS['components']['schemas'][TName]>
  : TOAS extends Checks<TName>['ModelWithDefinitionsNamed']
    ? FromSchema<TOAS['definitions'][TName]>
    : never
