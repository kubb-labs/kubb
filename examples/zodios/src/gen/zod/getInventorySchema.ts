import { z } from 'zod'

/**
 * @description successful operation
 */
export const getInventoryQueryResponseSchema = z.object({}).catchall(z.number().min(-2147483648).max(2147483647)).optional()
