import { faker } from '@faker-js/faker'
import type { PageSize } from '../models/ts/PageSize.ts'

export function createPageSizeFaker(_data?: Partial<PageSize>): PageSize {
  return faker.number.float()
}
