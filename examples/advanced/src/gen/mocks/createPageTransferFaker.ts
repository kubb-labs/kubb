import { faker } from '@faker-js/faker'
import type { PageTransfer } from '../models/ts/PageTransfer.ts'
import { createTransferFaker } from './createTransferFaker.ts'

export function createPageTransferFaker(data?: Partial<PageTransfer>): PageTransfer {
  return {
    ...{ next_cursor: faker.string.alpha(), items: faker.helpers.multiple(() => createTransferFaker()) },
    ...(data || {}),
  }
}
