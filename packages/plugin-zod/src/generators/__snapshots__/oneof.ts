export const oneof = z.union([z.object({ propertyA: z.string().optional() }), z.object({ propertyA: z.string().optional() })])
