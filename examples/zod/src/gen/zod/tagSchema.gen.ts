/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import { z } from '../../zod.ts'

export const tagSchema = z.object({
  id: z.int().optional(),
  name: z.string().optional(),
})

export type TagSchema = z.infer<typeof tagSchema>