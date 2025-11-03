import type { Order } from "../models/ts/Order.ts";
import { faker } from "@faker-js/faker";

export function createOrderFaker(data?: Partial<Order>): Order {
  
  return {
  ...{"id": faker.number.int({ min: 3, max: 100 }),"petId": faker.number.int(),"quantity": faker.number.int(),"orderType": faker.helpers.arrayElement<NonNullable<Order>["orderType"]>(["foo", "bar"]),"type": faker.string.alpha(),"shipDate": faker.date.anytime().toISOString(),"status": faker.helpers.arrayElement<any>(['working', 'idle']),"http_status": faker.helpers.arrayElement<NonNullable<Order>["http_status"]>([200, 400]),"complete": faker.datatype.boolean()},
  ...data || {}
  }
}