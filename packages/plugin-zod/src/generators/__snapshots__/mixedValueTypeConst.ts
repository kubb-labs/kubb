/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */
import { z } from 'zod'

/**
 * @description This probably should fail miserably
 */
export const mixedValueTypeConst = z
  .object({
    foobar: z.literal('foobar'),
  })
  .describe('This probably should fail miserably')
