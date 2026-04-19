import { pascalCase } from "@internals/utils";
import { narrowSchema } from "./guards.ts";
import type { SchemaNode } from "./nodes/schema.ts";
import { extractRefName } from "./refs.ts";
import { collect } from "./visitor.ts";

export function findDiscriminator(
  mapping: Record<string, string> | undefined,
  ref: string | undefined,
): string | null {
  if (!mapping || !ref) return null;
  return (
    Object.entries(mapping).find(([, value]) => value === ref)?.[0] ?? null
  );
}

export function childName(
  parentName: string | null | undefined,
  propName: string,
): string | null {
  return parentName ? pascalCase([parentName, propName].join(" ")) : null;
}

export function enumPropName(
  parentName: string | null | undefined,
  propName: string,
  enumSuffix: string,
): string {
  return pascalCase(
    [parentName, propName, enumSuffix].filter(Boolean).join(" "),
  );
}

/**
 * Collects import entries for all `ref` schema nodes in `node`.
 */
export function collectImports<TImport>({
  node,
  nameMapping,
  resolve,
}: {
  node: SchemaNode;
  nameMapping: Map<string, string>;
  resolve: (schemaName: string) => TImport | undefined;
}): Array<TImport> {
  return collect<TImport>(node, {
    schema(schemaNode): TImport | undefined {
      const schemaRef = narrowSchema(schemaNode, "ref");
      if (!schemaRef?.ref) return;

      const rawName = extractRefName(schemaRef.ref);
      const schemaName = nameMapping.get(rawName) ?? rawName;
      const result = resolve(schemaName);
      if (!result) return;

      return result;
    },
  });
}
