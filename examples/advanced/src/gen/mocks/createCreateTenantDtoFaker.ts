import type { CreateTenantDto } from '../models/ts/CreateTenantDto.ts'
import { faker } from '@faker-js/faker'

export function createCreateTenantDtoFaker(data?: Partial<CreateTenantDto>): CreateTenantDto {
  return {
    ...{
      shortName: faker.string.alpha(),
      name: faker.string.alpha(),
      resellerId: faker.number.float(),
      emailsAllowed: faker.helpers.multiple(() => faker.string.alpha()),
      emailsDenied: faker.helpers.multiple(() => faker.string.alpha()),
      domainsAllowed: faker.helpers.multiple(() => faker.string.alpha()),
    },
    ...(data || {}),
  }
}
