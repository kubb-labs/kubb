import type { Tenant } from '../models/ts/Tenant.ts'
import { faker } from '@faker-js/faker'

export function createTenantFaker(data?: Partial<Tenant>): Tenant {
  return {
    ...{
      id: faker.number.float(),
      shortName: faker.string.alpha(),
      name: faker.string.alpha(),
      emailsAllowed: faker.helpers.multiple(() => faker.string.alpha()),
      emailsDenied: faker.helpers.multiple(() => faker.string.alpha()),
      domainsAllowed: faker.helpers.multiple(() => faker.string.alpha()),
    },
    ...(data || {}),
  }
}
