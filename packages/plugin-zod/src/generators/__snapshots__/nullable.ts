/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */
import { z } from 'zod'

export const nullable = z
  .object({
    foo: z.string().nullable().nullish(),
  })
  .nullable()
