import { Model } from '@kubb/swagger-ts/infer'

import type { models } from './gen/index.ts'

export type UserModel = Model<models.Oas, 'User'>
