import zod from 'zod'

import { Pet } from './Pet'

export const FindPetsByStatusParams = zod.object({ status: zod.string().optional() })
export const FindPetsByStatusResponse = zod.array(Pet)
