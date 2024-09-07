export const optionalPetTyped = z.object({
  id: z.number().int().optional(),
  name: z.string().optional(),
  tag: z.string().optional(),
}) as z.ZodType<OptionalPetTyped>
