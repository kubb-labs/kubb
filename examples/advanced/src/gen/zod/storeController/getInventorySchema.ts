import z from 'zod'

/**
 * @description successful operation
 */
export const getInventoryResponseSchema = z.object({}).catchall(z.number())
