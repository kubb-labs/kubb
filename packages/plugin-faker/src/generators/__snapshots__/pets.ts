export function pets(data: NonNullable<Partial<Pets>> = []): NonNullable<Pets> {
  return [...(faker.helpers.arrayElements([pets()]) as any), ...data]
}
