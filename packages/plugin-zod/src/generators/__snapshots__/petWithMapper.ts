export const petWithMapper = z.object({ id: z.number().int(), name: z.string().email(), date: z.date().optional(), tag: z.string().min(5).max(100).optional() })
