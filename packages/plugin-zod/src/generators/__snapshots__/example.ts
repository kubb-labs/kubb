export const example = z.object({ nestedExamples: z.lazy(() => example).optional() })
