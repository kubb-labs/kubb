/**
 * Generates a synthetic OpenAPI 3.0 spec with `schemaCount` component schemas
 * and one GET operation per schema. Used only for benchmarking.
 */
export function generateLargeSpec(schemaCount: number): unknown {
  const schemas: Record<string, unknown> = {}
  const paths: Record<string, unknown> = {}

  for (let i = 0; i < schemaCount; i++) {
    const name = `Model${i}`
    schemas[name] = {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
        relatedId: { type: 'integer', nullable: true },
      },
      required: ['id', 'name'],
    }

    paths[`/models/${i}`] = {
      get: {
        operationId: `getModel${i}`,
        summary: `Get model ${i}`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${name}` },
              },
            },
          },
        },
      },
    }
  }

  return {
    openapi: '3.0.3',
    info: { title: 'Benchmark Spec', version: '1.0.0' },
    paths,
    components: { schemas },
  }
}
