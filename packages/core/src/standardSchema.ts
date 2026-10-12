/**
 * The parts of the Standard Schema v1 interfaces (https://standardschema.dev) that Kubb reads,
 * copied as the spec recommends so core needs no schema library. Zod, Valibot and ArkType
 * schemas all match them.
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaV1.Props<Input, Output>
}

export declare namespace StandardSchemaV1 {
  interface Props<Input = unknown, Output = Input> {
    readonly version: 1
    readonly vendor: string
    readonly validate: (value: unknown) => Result<Output> | Promise<Result<Output>>
    readonly types?: Types<Input, Output> | undefined
  }

  type Result<Output> = SuccessResult<Output> | FailureResult

  interface SuccessResult<Output> {
    readonly value: Output
    readonly issues?: undefined
  }

  interface FailureResult {
    readonly issues: ReadonlyArray<Issue>
  }

  interface Issue {
    readonly message: string
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined
  }

  interface PathSegment {
    readonly key: PropertyKey
  }

  interface Types<Input = unknown, Output = Input> {
    readonly input: Input
    readonly output: Output
  }

  type InferInput<Schema extends StandardSchemaV1> = NonNullable<Schema['~standard']['types']>['input']

  type InferOutput<Schema extends StandardSchemaV1> = NonNullable<Schema['~standard']['types']>['output']
}

/**
 * The parts of the Standard JSON Schema v1 interface (https://standardschema.dev/json-schema) that Kubb reads.
 * Zod 4.2 and later implement it next to `validate`.
 */
export interface StandardJSONSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardJSONSchemaV1.Props<Input, Output>
}

export declare namespace StandardJSONSchemaV1 {
  interface Props<Input = unknown, Output = Input> {
    readonly version: 1
    readonly vendor: string
    readonly types?: StandardSchemaV1.Types<Input, Output> | undefined
    readonly jsonSchema: Converter
  }

  interface Converter {
    readonly input: (options: Options) => Record<string, unknown>
    readonly output: (options: Options) => Record<string, unknown>
  }

  type Target = 'draft-2020-12' | 'draft-07' | 'openapi-3.0' | (string & {})

  interface Options {
    readonly target: Target
    readonly libraryOptions?: Record<string, unknown> | undefined
  }
}
