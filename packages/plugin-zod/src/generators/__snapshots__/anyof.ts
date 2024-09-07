export const anyof = z.union([z.object({ propertyA: z.string() }).strict(), z.object({ propertyA: z.string(), propertyB: z.string() }).strict()])
