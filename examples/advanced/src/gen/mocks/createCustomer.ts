import { faker } from "@faker-js/faker";

import { createAddress } from "./createAddress";
import { Customer } from "../models/ts/Customer";


export function createCustomer(): NonNullable<Customer> {
  return {"id": faker.number.float({}),"username": faker.string.alpha(),"address": faker.helpers.arrayElements([createAddress()]) as any};
}
  