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
    /**
     * From the Standard JSON Schema extension, which Zod and ArkType implement.
     */
    readonly jsonSchema?: JsonSchemaConverter | undefined
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

  interface JsonSchemaConverter {
    readonly input: (options: { readonly target: string; readonly libraryOptions?: Record<string, unknown> }) => Record<string, unknown>
  }
}
