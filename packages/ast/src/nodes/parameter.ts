import type { BaseNode } from "./base.ts";
import type { SchemaNode } from "./schema.ts";

export type ParameterLocation = "path" | "query" | "header" | "cookie";

/**
 * AST node representing one operation parameter.
 *
 * @example
 * ```ts
 * const param: ParameterNode = {
 *   kind: 'Parameter',
 *   name: 'petId',
 *   in: 'path',
 *   schema: createSchema({ type: 'string' }),
 *   required: true,
 * }
 * ```
 */
export type ParameterNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: "Parameter";
  /**
   * Parameter name.
   */
  name: string;
  /**
   * Parameter location (`path`, `query`, `header`, or `cookie`).
   */
  in: ParameterLocation;
  /**
   * Parameter schema.
   */
  schema: SchemaNode;
  /**
   * Whether the parameter is required.
   */
  required: boolean;
};
