import zod from 'zod'

import { petSchema } from './petSchema'

export const petsSchema = zod.array(petSchema)
