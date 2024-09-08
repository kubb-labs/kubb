export function pets(data: NonNullable<Partial<Pets>> = []) {
  return [...(faker.helpers.arrayElements([pets()]) as any), ...data]
}
