import z from 'zod'

/**
 * @description successful operation
 */
export const getInventoryQueryResponseSchema = z.object({}).catchall(z.number())
