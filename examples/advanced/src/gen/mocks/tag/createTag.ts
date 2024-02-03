import { faker } from '@faker-js/faker'
import type { TagTag } from '../../models/ts/tag/Tag'

export function createTagTag(override: Partial<TagTag> = {}): NonNullable<TagTag> {
  return {
    ...{ 'id': faker.number.float({}), 'name': faker.string.alpha() },
    ...override,
  }
}
