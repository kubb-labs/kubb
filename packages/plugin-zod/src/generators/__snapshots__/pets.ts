export const pets = z.array(z.object({ id: z.number().int(), name: z.string(), tag: z.string().optional() })) as z.ZodType<Pets>
