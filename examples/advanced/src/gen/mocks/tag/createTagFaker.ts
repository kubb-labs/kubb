import type { TagTag } from '../../models/ts/tag/Tag.js'
import { faker } from '@faker-js/faker'

export function createTagTagFaker(data: NonNullable<Partial<TagTag>> = {}) {
  return {
    ...{ id: faker.number.int(), name: faker.string.alpha() },
    ...data,
  }
}
