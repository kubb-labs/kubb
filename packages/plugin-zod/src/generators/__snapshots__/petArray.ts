import { z } from 'zod'

/**
 * @description List of Pet object
 */
export const petArray = z
  .array(z.lazy(() => pet))
  .min(1)
  .max(3)
  .describe('List of Pet object')
