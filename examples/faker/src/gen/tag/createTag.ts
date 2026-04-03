export function createTag(data?: Partial<Tag>): Tag {

  return {
    ...{"id": faker.number.int(),"name": faker.string.alpha()},
    ...data || {}
  }
}