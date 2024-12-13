import { z } from 'zod'

export const enumNullable = z.enum(['Pending', 'Received']).nullable()
