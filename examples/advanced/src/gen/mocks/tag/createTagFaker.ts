import { faker } from '@faker-js/faker'
import type { TagTag } from '../../models/ts/tag/Tag.ts'

export function createTagTagFaker(data?: Partial<TagTag>) {
  return {
    ...{ id: faker.number.int({ min: 5, max: 7 }), name: faker.string.alpha() },
    ...(data || {}),
  } as TagTag
}
