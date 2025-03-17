import type { Item } from '../models/Item.ts'
import { faker } from '@faker-js/faker'

export function createItem(data?: Partial<Item>): Item {
  return {
    ...{ name: faker.string.alpha({ length: { min: 3, max: 25 } }), price: faker.number.float() },
    ...(data || {}),
  }
}
