import { Generator } from './Generator'
/**
 * Abstract class that contains the building blocks for plugins to create their own SchemaGenerator
 */
export abstract class SchemaGenerator<TOptions extends object, TInput, TOutput> extends Generator<TOptions> {
  abstract build(schema: TInput, name: string, description?: string): TOutput
}
