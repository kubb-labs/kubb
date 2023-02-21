import zod from 'zod'

import { Pet } from './Pet'

export const GetPetByIdParams = zod.object({ petId: zod.number().optional() })
export const GetPetByIdResponse = Pet
