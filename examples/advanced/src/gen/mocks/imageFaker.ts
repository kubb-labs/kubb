import { faker } from '@faker-js/faker'
import type { Image } from '../models/ts/image.ts'

export function createImageFaker(_data?: Partial<Image>): Image {
  return faker.string.alpha()
}
