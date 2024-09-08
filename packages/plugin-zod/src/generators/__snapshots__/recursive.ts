import { z } from 'zod'

export const example = z.object({ name: z.string(), children: z.array(z.lazy(() => example)) })
