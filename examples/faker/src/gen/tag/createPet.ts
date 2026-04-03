export function createPet(data?: Partial<Pet>): Pet {

  return {
    ...{"id": faker.number.int(),"name": faker.string.alpha(),"category": createCategory(),"photoUrls": faker.helpers.multiple(() => (faker.string.alpha())),"tags": faker.helpers.multiple(() => (createTag())),"status": faker.helpers.arrayElement<NonNullable<Pet>["status"]>(["available", "pending", "sold"])},
    ...data || {}
  }
}