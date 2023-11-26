import { z } from 'zod'

/**
 * @description successful operation
 */
export const getInventoryQueryResponseSchema = z.object({}).catchall(z.number().max(2147483647).min(-2147483648))
