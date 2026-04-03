export function createCategory(data?: Partial<Category>): Category {

  return {
    ...{"id": faker.number.int(),"name": faker.string.alpha()},
    ...data || {}
  }
}