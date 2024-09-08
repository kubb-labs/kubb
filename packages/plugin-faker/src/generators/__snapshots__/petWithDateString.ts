export function petWithDateString(data: NonNullable<Partial<PetWithDateString>> = {}) {
  return {
    ...{
      id: faker.number.int(),
      name: faker.string.alpha(),
      tag: faker.string.alpha(),
      code: faker.helpers.arrayElement<any>([faker.string.alpha(), faker.helpers.fromRegExp(new RegExp('\\b[1-9]\\b'))]),
      shipDate: faker.date.anytime().toString(),
      shipTime: faker.date.anytime().toString(),
    },
    ...data,
  }
}
