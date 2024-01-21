import { createCategory } from './createCategory'
import { createTagTag } from './tag/createTag'
import { faker } from '@faker-js/faker'
import type { AddPetRequest } from '../models/ts/AddPetRequest'

export function createAddPetRequest(): NonNullable<AddPetRequest> {
  return {
    'id': faker.number.float({}),
    'name': faker.string.alpha(),
    'category': createCategory(),
    'photoUrls': faker.helpers.arrayElements([faker.string.alpha()]) as any,
    'tags': faker.helpers.arrayElements([createTagTag()]) as any,
    'status': faker.helpers.arrayElement<any>([`available`, `pending`, `sold`]),
  }
}
