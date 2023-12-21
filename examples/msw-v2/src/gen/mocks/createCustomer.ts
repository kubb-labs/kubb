import { createAddress } from './createAddress'
import { faker } from '@faker-js/faker'
import type { Customer } from '../models/Customer'

export function createCustomer(): NonNullable<Customer> {
  faker.seed([220])
  return { 'id': faker.number.float({}), 'username': faker.string.alpha(), 'address': faker.helpers.arrayElements([createAddress()]) as any }
}
