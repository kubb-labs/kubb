export * from './preserve.ts'
export * from './propagate.ts'

/**
 * How the `discriminator` property on `oneOf`/`anyOf` schemas is interpreted.
 * - `'preserve'`: union members are narrowed inline at each usage site ({@link narrowUnionMembers},
 *   {@link extractDiscriminatedAllOfMembers}). The referenced child schema's own definition is
 *   left untouched.
 * - `'propagate'`: on top of the same inline narrowing, a post-pass ({@link buildDiscriminatorChildMap},
 *   {@link patchDiscriminatorNode}) pushes the discriminant onto each child schema's own
 *   definition, so referencing it directly (outside the union) still carries the discriminant.
 */
export type DiscriminatorStrategy = 'preserve' | 'propagate'
