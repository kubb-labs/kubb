import type { WeldPackType } from '../models/ts/WeldPackType.ts'
import { faker } from '@faker-js/faker'

export function createWeldPackTypeFaker() {
  return faker.helpers.arrayElement<any>(['SETUP', 'DEMO', 'FULL'])
}
