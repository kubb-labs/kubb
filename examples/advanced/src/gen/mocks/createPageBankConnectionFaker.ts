import { faker } from '@faker-js/faker'
import type { PageBankConnection } from '../models/ts/PageBankConnection.ts'
import { createBankConnectionFaker } from './createBankConnectionFaker.ts'

export function createPageBankConnectionFaker(data?: Partial<PageBankConnection>): PageBankConnection {
  return {
    ...{ next_cursor: faker.string.alpha(), items: faker.helpers.multiple(() => createBankConnectionFaker()) },
    ...(data || {}),
  }
}
