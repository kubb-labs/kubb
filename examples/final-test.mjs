// Final validation test demonstrating the fix
import { z } from './node_modules/zod/lib/index.mjs';

console.log("=== Demonstrating oneOf Fix ===\n");

// Before (what the old code generated - just z.union)
const oldOneOf = z.union([
  z.object({ valueA: z.string() }),
  z.object({ valueB: z.number() })
]);

// After (what the new code generates - with superRefine validation)
const newOneOf = z.any().superRefine((value, ctx) => {
  const schemas = [
    z.object({ valueA: z.string() }),
    z.object({ valueB: z.number() })
  ];
  let matches = 0;
  for (const schema of schemas) {
    if (schema.safeParse(value).success) {
      matches++;
      if (matches > 1) break;
    }
  }
  if (matches === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid input: Should pass one schema in oneOf"
    });
  } else if (matches > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid input: Should pass only one schema in oneOf"
    });
  }
}).pipe(z.union([
  z.object({ valueA: z.string() }),
  z.object({ valueB: z.number() })
]));

// Test case from the issue
const invalidData = { valueA: "test", valueB: 123 };
const validA = { valueA: "test" };
const validB = { valueB: 123 };

console.log("Test Case: Object with BOTH properties (should be invalid for oneOf)\n");
console.log("  Data:", JSON.stringify(invalidData));
console.log("  Old implementation (wrong):", oldOneOf.safeParse(invalidData).success, "← BUG!");
console.log("  New implementation (correct):", newOneOf.safeParse(invalidData).success, "← FIXED! ✓");

console.log("\nTest Case: Object with only TypeA property (should be valid)\n");
console.log("  Data:", JSON.stringify(validA));
console.log("  Old implementation:", oldOneOf.safeParse(validA).success, "✓");
console.log("  New implementation:", newOneOf.safeParse(validA).success, "✓");

console.log("\nTest Case: Object with only TypeB property (should be valid)\n");
console.log("  Data:", JSON.stringify(validB));
console.log("  Old implementation:", oldOneOf.safeParse(validB).success, "✓");
console.log("  New implementation:", newOneOf.safeParse(validB).success, "✓");

const newResult = newOneOf.safeParse(invalidData);
if (!newResult.success) {
  console.log("\n✅ Fix validated! Error message:");
  console.log("  ", newResult.error.errors[0].message);
}
