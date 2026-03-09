import { faker } from '@faker-js/faker'
import type { Page } from '../models/ts/Page.ts'

export function createPageFaker(_data?: Partial<Page>): Page {
  return faker.string.alpha()
}
