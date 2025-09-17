import type { GetTenantResponse } from '../models/ts/GetTenantResponse.ts'
import { createLicenseFaker } from './createLicenseFaker.ts'
import { createResellerFaker } from './createResellerFaker.ts'
import { createWeldPackFaker } from './createWeldPackFaker.ts'
import { faker } from '@faker-js/faker'

export function createGetTenantResponseFaker(data?: Partial<GetTenantResponse>): GetTenantResponse {
  return {
    ...{
      id: faker.number.float(),
      shortName: faker.string.alpha(),
      name: faker.string.alpha(),
      emailsAllowed: faker.helpers.multiple(() => faker.string.alpha()),
      emailsDenied: faker.helpers.multiple(() => faker.string.alpha()),
      domainsAllowed: faker.helpers.multiple(() => faker.string.alpha()),
      licenses: faker.helpers.multiple(() => createLicenseFaker()),
      weldPacks: faker.helpers.multiple(() => createWeldPackFaker()),
      reseller: createResellerFaker(),
    },
    ...(data || {}),
  }
}
