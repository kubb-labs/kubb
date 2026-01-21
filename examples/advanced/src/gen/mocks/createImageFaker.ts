import type { Image } from '../models/ts/Image.ts'
import { faker } from '@faker-js/faker'

export function createImageFaker(data?: Partial<Image>): Image {
  return faker.string.alpha()
}
