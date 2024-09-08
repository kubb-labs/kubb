import { z } from 'zod'

export const example = z.object({ nestedExamples: z.lazy(() => example).optional() })
