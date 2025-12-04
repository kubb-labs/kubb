import { faker } from '@faker-js/faker'
import type { PageVendorResponse } from '../models/ts/PageVendorResponse.ts'
import { createVendorResponseFaker } from './createVendorResponseFaker.ts'

export function createPageVendorResponseFaker(data?: Partial<PageVendorResponse>): PageVendorResponse {
  return {
    ...{ next_cursor: faker.string.alpha(), items: faker.helpers.multiple(() => createVendorResponseFaker()) },
    ...(data || {}),
  }
}
