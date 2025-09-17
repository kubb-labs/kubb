import type { WeldPack } from '../models/ts/WeldPack.ts'
import { createTenantFaker } from './createTenantFaker.ts'
import { createWeldPackTypeFaker } from './createWeldPackTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createWeldPackFaker(data?: Partial<WeldPack>): WeldPack {
  return {
    ...{
      id: faker.number.float(),
      initialWeldCredits: faker.number.float(),
      consumedWeldCredits: faker.number.float(),
      activationDate: faker.date.anytime().toISOString(),
      durationDays: faker.number.float(),
      lastActivationDate: faker.date.anytime().toISOString(),
      type: Object.assign({}, createWeldPackTypeFaker()),
      isDeactivated: faker.datatype.boolean(),
      tenant: Object.assign({}, createTenantFaker()),
      expirationDate: faker.date.anytime().toISOString(),
      isActive: faker.datatype.boolean(),
    },
    ...(data || {}),
  }
}
