export const optionalPetInfer = z.object({ id: z.number().int().optional(), name: z.string().optional(), tag: z.string().optional() })

export type OptionalPetInfer = z.infer<typeof optionalPetInfer>
