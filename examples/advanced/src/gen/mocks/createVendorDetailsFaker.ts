import { faker } from '@faker-js/faker'
import type { VendorDetails } from '../models/ts/VendorDetails.ts'
import { createCounterPartyTypeFaker } from './createCounterPartyTypeFaker.ts'

export function createVendorDetailsFaker(_data?: Partial<VendorDetails>): VendorDetails {
  return Object.assign({}, { type: createCounterPartyTypeFaker(), payment_instrument_id: faker.string.alpha() })
}
