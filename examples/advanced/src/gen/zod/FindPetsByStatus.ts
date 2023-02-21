import zod from 'zod'

import { Pet } from './Pet'

export const FindPetsByStatusParams = zod.object({ status: zod.enum(['available', 'pending', 'sold']).optional() })
export const FindPetsByStatusResponse = zod.array(Pet)
