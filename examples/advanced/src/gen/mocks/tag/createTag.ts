import { faker } from '@faker-js/faker'
import type { TagTag } from '../../models/ts/tag/Tag'

export function createTagTag(override: NonNullable<Partial<TagTag>> = {}): NonNullable<TagTag> {
  return {
    ...{ 'id': faker.number.int({}), 'name': faker.string.alpha() },
    ...override,
  }
}
