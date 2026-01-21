import { faker } from '@faker-js/faker'
import type { Image } from '../models/ts/Image.ts'

export function createImageFaker(_data?: Partial<Image>) {
  return faker.string.alpha() as Image
}
