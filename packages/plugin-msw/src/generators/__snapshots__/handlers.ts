import { listPets, createPets, showPetById } from './findByTags.ts'

export const handlers = [listPets, createPets, showPetById] as const
