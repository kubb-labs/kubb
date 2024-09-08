import { z } from 'zod'

/**
 * @description Tuple of exact length 2 nested in an object
 */
export const petTupleObject = z.object({ tupleProperty: z.tuple([z.string(), z.string()]).optional() }).describe('Tuple of exact length 2 nested in an object')
