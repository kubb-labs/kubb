import dayjs from 'dayjs'
import type { Order } from '../models/Order.ts'
import { faker } from '@faker-js/faker'

export function createOrder(data: NonNullable<Partial<Order>> = {}) {
  return {
    ...{
      id: faker.number.int(),
      petId: faker.number.int(),
      quantity: faker.number.int(),
      shipDateTime: faker.date.anytime().toISOString(),
      shipDate: dayjs(faker.date.anytime()).format('YYYY-MM-DD'),
      shipTime: dayjs(faker.date.anytime()).format('HH:mm:ss'),
      status: faker.helpers.arrayElement<any>(['placed', 'approved', 'delivered']),
      complete: faker.datatype.boolean(),
    },
    ...data,
  }
}
