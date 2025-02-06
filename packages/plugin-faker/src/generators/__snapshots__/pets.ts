import { faker } from '@faker-js/faker'

export function pets(data?: Partial<Pets>): Partial<Pets> {
  return [...(faker.helpers.multiple(() => pet()) as any), ...(data || [])]
}
