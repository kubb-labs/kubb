import { createCategory } from './createCategory'
import { createTag } from './createTag'
import { faker } from '@faker-js/faker'
import type { AddPetRequest } from '../models/AddPetRequest'

export function createAddPetRequest(override: NonNullable<Partial<AddPetRequest>> = {}): NonNullable<AddPetRequest> {
  return {
    ...{
      'id': faker.number.float({}),
      'name': faker.string.alpha(),
      'category': createCategory(),
      'photoUrls': faker.helpers.arrayElements([faker.string.alpha()]) as any,
      'tags': faker.helpers.arrayElements([createTag()]) as any,
      'status': faker.helpers.arrayElement<any>([`available`, `pending`, `sold`]),
    },
    ...override,
  }
}
