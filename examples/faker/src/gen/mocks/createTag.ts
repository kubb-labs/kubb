import { faker } from '@faker-js/faker'

import type { Tag } from '../models/Tag'

export function createTag(): Tag {
  return { id: faker.number.float({}), name: faker.string.alpha() }
}
