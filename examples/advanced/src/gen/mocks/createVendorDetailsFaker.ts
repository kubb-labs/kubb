import type { VendorDetails } from '../models/ts/VendorDetails.ts'
import { createCounterPartyTypeFaker } from './createCounterPartyTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createVendorDetailsFaker(data?: Partial<VendorDetails>): VendorDetails {
  return Object.assign({}, { type: createCounterPartyTypeFaker(), payment_instrument_id: faker.string.alpha() })
}
