import type { UpdateTenantDto } from '../models/ts/UpdateTenantDto.ts'
import { faker } from '@faker-js/faker'

export function createUpdateTenantDtoFaker(data?: Partial<UpdateTenantDto>): UpdateTenantDto {
  return {
    ...{
      name: faker.string.alpha(),
      resellerId: faker.number.float(),
      emailsAllowed: faker.helpers.multiple(() => faker.string.alpha()),
      emailsDenied: faker.helpers.multiple(() => faker.string.alpha()),
      domainsAllowed: faker.helpers.multiple(() => faker.string.alpha()),
    },
    ...(data || {}),
  }
}
