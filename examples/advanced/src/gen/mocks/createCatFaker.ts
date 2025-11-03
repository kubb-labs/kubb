import type { Cat } from "../models/ts/Cat.ts";
import { faker } from "@faker-js/faker";

export function createCatFaker(data?: Partial<Cat>): Cat {
  
  return {
  ...{"type": faker.string.alpha({ length: 1 }),"name": faker.string.alpha(),"indoor": faker.datatype.boolean()},
  ...data || {}
  }
}