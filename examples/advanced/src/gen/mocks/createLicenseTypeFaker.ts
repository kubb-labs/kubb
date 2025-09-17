import type { LicenseType } from '../models/ts/LicenseType.ts'
import { faker } from '@faker-js/faker'

export function createLicenseTypeFaker() {
  return faker.helpers.arrayElement<any>(['SETUP', 'DEMO', 'FULL'])
}
