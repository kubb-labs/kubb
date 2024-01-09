import { faker } from "@faker-js/faker";
import type { Category } from "../models/ts/Category";


export function createCategory(): NonNullable<Category> {
  
  return {"id": faker.number.float({}),"name": faker.string.alpha()};
}