import { z } from 'zod'
import { userSchema } from './userSchema'

export const userArraySchema = z.array(z.lazy(() => userSchema))
