export const recursive = z.object({ name: z.string(), children: z.array(z.lazy(() => recursive)) })
