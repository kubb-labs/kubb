// configs/kubb.config.ts
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
const kubb_config_default = defineConfig(() => {
  return {
    root: '.',
    input: {
      // path: './test.json',
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    hooks: {
      done: ['npm run typecheck'],
    },
    plugins: [
      pluginOas({ validate: false }),
      pluginOas({
        output: {
          path: 'schemas2',
        },
        validate: false,
      }),
      pluginTs({
        output: {
          path: 'models/ts',
          extName: '.js',
        },
        group: {
          type: 'tag',
        },
        enumType: 'asPascalConst',
        enumSuffix: 'enum',
        dateType: 'date',
        override: [
          {
            type: 'operationId',
            pattern: 'findPetsByStatus',
            options: {
              enumType: 'enum',
            },
          },
        ],
      }),
      pluginTanstackQuery({
        output: {
          path: './clients/hooks',
          exportAs: 'hooks',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        override: [
          {
            type: 'tag',
            pattern: 'pet',
            options: {
              infinite: {
                queryParam: 'test',
                initialPageParam: '0',
              },
              mutate: {
                methods: ['post', 'put', 'delete'],
                variablesType: 'mutate',
              },
            },
          },
        ],
        group: { type: 'tag' },
        client: {
          importPath: '../../../../tanstack-query-client.ts',
        },
        query: {
          importPath: '../../../../tanstack-query-hook.ts',
        },
        infinite: {},
        dataReturnType: 'full',
        parser: 'zod',
      }),
      pluginSwr({
        output: {
          path: './clients/swr',
          exportAs: 'swrHooks',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: { type: 'tag' },
        client: {
          importPath: '../../../../swr-client.ts',
        },
        dataReturnType: 'full',
        parser: 'zod',
      }),
      pluginClient({
        output: {
          path: './clients/axios',
          exportAs: 'clients',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: { type: 'tag', output: './clients/axios/{{tag}}Service' },
        client: {
          importPath: '../../../../axios-client.ts',
        },
        dataReturnType: 'full',
        pathParamsType: 'object',
      }),
      pluginZod({
        output: {
          path: './zod',
          exportAs: 'zod',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: { type: 'tag' },
        dateType: 'stringOffset',
        typed: true,
      }),
      pluginFaker({
        output: {
          path: 'mocks',
          exportAs: 'faker',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: { type: 'tag' },
        dateType: 'date',
        mapper: {
          status: `faker.helpers.arrayElement(['working', 'idle']) as any`,
        },
      }),
      pluginMsw({
        output: {
          path: 'msw',
          exportAs: 'msw',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: { type: 'tag' },
      }),
    ],
  }
})
export { kubb_config_default as default }
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiY29uZmlncy9rdWJiLmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX19pbmplY3RlZF9maWxlbmFtZV9fID0gXCIvVXNlcnMvc3Rpam52YW5odWxsZS9HaXRIdWIva3ViYi9leGFtcGxlcy9hZHZhbmNlZC9jb25maWdzL2t1YmIuY29uZmlnLnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9Vc2Vycy9zdGlqbnZhbmh1bGxlL0dpdEh1Yi9rdWJiL2V4YW1wbGVzL2FkdmFuY2VkL2NvbmZpZ3NcIjtjb25zdCBfX2luamVjdGVkX2ltcG9ydF9tZXRhX3VybF9fID0gXCJmaWxlOi8vL1VzZXJzL3N0aWpudmFuaHVsbGUvR2l0SHViL2t1YmIvZXhhbXBsZXMvYWR2YW5jZWQvY29uZmlncy9rdWJiLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ0BrdWJiL2NvcmUnXG5pbXBvcnQgeyBwbHVnaW5PYXMgfSBmcm9tICdAa3ViYi9wbHVnaW4tb2FzJ1xuaW1wb3J0IHsgcGx1Z2luQ2xpZW50IH0gZnJvbSAnQGt1YmIvcGx1Z2luLWNsaWVudCdcbmltcG9ydCB7IHBsdWdpbkZha2VyIH0gZnJvbSAnQGt1YmIvcGx1Z2luLWZha2VyJ1xuaW1wb3J0IHsgcGx1Z2luTXN3IH0gZnJvbSAnQGt1YmIvcGx1Z2luLW1zdydcbmltcG9ydCB7IHBsdWdpblN3ciB9IGZyb20gJ0BrdWJiL3BsdWdpbi1zd3InXG5pbXBvcnQgeyBwbHVnaW5UYW5zdGFja1F1ZXJ5IH0gZnJvbSAnQGt1YmIvcGx1Z2luLXRhbnN0YWNrLXF1ZXJ5J1xuaW1wb3J0IHsgcGx1Z2luVHMgfSBmcm9tICdAa3ViYi9wbHVnaW4tdHMnXG5pbXBvcnQgeyBwbHVnaW5ab2QgfSBmcm9tICdAa3ViYi9wbHVnaW4tem9kJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKCkgPT4ge1xuICByZXR1cm4ge1xuICAgIHJvb3Q6ICcuJyxcbiAgICBpbnB1dDoge1xuICAgICAgLy8gcGF0aDogJy4vdGVzdC5qc29uJyxcbiAgICAgIHBhdGg6ICcuL3BldFN0b3JlLnlhbWwnLFxuICAgIH0sXG4gICAgb3V0cHV0OiB7XG4gICAgICBwYXRoOiAnLi9zcmMvZ2VuJyxcbiAgICAgIGNsZWFuOiB0cnVlLFxuICAgIH0sXG4gICAgaG9va3M6IHtcbiAgICAgIGRvbmU6IFsnbnBtIHJ1biB0eXBlY2hlY2snXSxcbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgIHBsdWdpbk9hcyh7IHZhbGlkYXRlOiBmYWxzZSB9KSxcbiAgICAgIHBsdWdpbk9hcyh7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIHBhdGg6ICdzY2hlbWFzMicsXG4gICAgICAgIH0sXG4gICAgICAgIHZhbGlkYXRlOiBmYWxzZSxcbiAgICAgIH0pLFxuICAgICAgcGx1Z2luVHMoe1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBwYXRoOiAnbW9kZWxzL3RzJyxcbiAgICAgICAgICBleHROYW1lOiAnLmpzJyxcbiAgICAgICAgfSxcbiAgICAgICAgZ3JvdXA6IHtcbiAgICAgICAgICB0eXBlOiAndGFnJyxcbiAgICAgICAgfSxcbiAgICAgICAgZW51bVR5cGU6ICdhc1Bhc2NhbENvbnN0JyxcbiAgICAgICAgZW51bVN1ZmZpeDogJ2VudW0nLFxuICAgICAgICBkYXRlVHlwZTogJ2RhdGUnLFxuICAgICAgICBvdmVycmlkZTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6ICdvcGVyYXRpb25JZCcsXG4gICAgICAgICAgICBwYXR0ZXJuOiAnZmluZFBldHNCeVN0YXR1cycsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIGVudW1UeXBlOiAnZW51bScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICAgIHBsdWdpblRhbnN0YWNrUXVlcnkoe1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBwYXRoOiAnLi9jbGllbnRzL2hvb2tzJyxcbiAgICAgICAgICBleHBvcnRBczogJ2hvb2tzJyxcbiAgICAgICAgfSxcbiAgICAgICAgZXhjbHVkZTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6ICd0YWcnLFxuICAgICAgICAgICAgcGF0dGVybjogJ3N0b3JlJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBvdmVycmlkZTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6ICd0YWcnLFxuICAgICAgICAgICAgcGF0dGVybjogJ3BldCcsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIGluZmluaXRlOiB7XG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbTogJ3Rlc3QnLFxuICAgICAgICAgICAgICAgIGluaXRpYWxQYWdlUGFyYW06ICcwJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbXV0YXRlOiB7XG4gICAgICAgICAgICAgICAgbWV0aG9kczogWydwb3N0JywgJ3B1dCcsICdkZWxldGUnXSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXNUeXBlOiAnbXV0YXRlJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZ3JvdXA6IHsgdHlwZTogJ3RhZycgfSxcbiAgICAgICAgY2xpZW50OiB7XG4gICAgICAgICAgaW1wb3J0UGF0aDogJy4uLy4uLy4uLy4uL3RhbnN0YWNrLXF1ZXJ5LWNsaWVudC50cycsXG4gICAgICAgIH0sXG4gICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgaW1wb3J0UGF0aDogJy4uLy4uLy4uLy4uL3RhbnN0YWNrLXF1ZXJ5LWhvb2sudHMnLFxuICAgICAgICB9LFxuICAgICAgICBpbmZpbml0ZToge30sXG4gICAgICAgIGRhdGFSZXR1cm5UeXBlOiAnZnVsbCcsXG4gICAgICAgIHBhcnNlcjogJ3pvZCcsXG4gICAgICB9KSxcbiAgICAgIHBsdWdpblN3cih7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIHBhdGg6ICcuL2NsaWVudHMvc3dyJyxcbiAgICAgICAgICBleHBvcnRBczogJ3N3ckhvb2tzJyxcbiAgICAgICAgfSxcbiAgICAgICAgZXhjbHVkZTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6ICd0YWcnLFxuICAgICAgICAgICAgcGF0dGVybjogJ3N0b3JlJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBncm91cDogeyB0eXBlOiAndGFnJyB9LFxuICAgICAgICBjbGllbnQ6IHtcbiAgICAgICAgICBpbXBvcnRQYXRoOiAnLi4vLi4vLi4vLi4vc3dyLWNsaWVudC50cycsXG4gICAgICAgIH0sXG4gICAgICAgIGRhdGFSZXR1cm5UeXBlOiAnZnVsbCcsXG4gICAgICAgIHBhcnNlcjogJ3pvZCcsXG4gICAgICB9KSxcbiAgICAgIHBsdWdpbkNsaWVudCh7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIHBhdGg6ICcuL2NsaWVudHMvYXhpb3MnLFxuICAgICAgICAgIGV4cG9ydEFzOiAnY2xpZW50cycsXG4gICAgICAgIH0sXG4gICAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAndGFnJyxcbiAgICAgICAgICAgIHBhdHRlcm46ICdzdG9yZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZ3JvdXA6IHsgdHlwZTogJ3RhZycsIG91dHB1dDogJy4vY2xpZW50cy9heGlvcy97e3RhZ319U2VydmljZScgfSxcbiAgICAgICAgY2xpZW50OiB7XG4gICAgICAgICAgaW1wb3J0UGF0aDogJy4uLy4uLy4uLy4uL2F4aW9zLWNsaWVudC50cycsXG4gICAgICAgIH0sXG4gICAgICAgIGRhdGFSZXR1cm5UeXBlOiAnZnVsbCcsXG4gICAgICAgIHBhdGhQYXJhbXNUeXBlOiAnb2JqZWN0JyxcbiAgICAgIH0pLFxuICAgICAgcGx1Z2luWm9kKHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgcGF0aDogJy4vem9kJyxcbiAgICAgICAgICBleHBvcnRBczogJ3pvZCcsXG4gICAgICAgIH0sXG4gICAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAndGFnJyxcbiAgICAgICAgICAgIHBhdHRlcm46ICdzdG9yZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZ3JvdXA6IHsgdHlwZTogJ3RhZycgfSxcbiAgICAgICAgZGF0ZVR5cGU6ICdzdHJpbmdPZmZzZXQnLFxuICAgICAgICB0eXBlZDogdHJ1ZSxcbiAgICAgIH0pLFxuICAgICAgcGx1Z2luRmFrZXIoe1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBwYXRoOiAnbW9ja3MnLFxuICAgICAgICAgIGV4cG9ydEFzOiAnZmFrZXInLFxuICAgICAgICB9LFxuICAgICAgICBleGNsdWRlOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ3RhZycsXG4gICAgICAgICAgICBwYXR0ZXJuOiAnc3RvcmUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGdyb3VwOiB7IHR5cGU6ICd0YWcnIH0sXG4gICAgICAgIGRhdGVUeXBlOiAnZGF0ZScsXG4gICAgICAgIG1hcHBlcjoge1xuICAgICAgICAgIHN0YXR1czogYGZha2VyLmhlbHBlcnMuYXJyYXlFbGVtZW50KFsnd29ya2luZycsICdpZGxlJ10pIGFzIGFueWAsXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIHBsdWdpbk1zdyh7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIHBhdGg6ICdtc3cnLFxuICAgICAgICAgIGV4cG9ydEFzOiAnbXN3JyxcbiAgICAgICAgfSxcbiAgICAgICAgZXhjbHVkZTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6ICd0YWcnLFxuICAgICAgICAgICAgcGF0dGVybjogJ3N0b3JlJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBncm91cDogeyB0eXBlOiAndGFnJyB9LFxuICAgICAgfSksXG4gICAgXSxcbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFQsU0FBUyxvQkFBb0I7QUFDelYsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxtQkFBbUI7QUFDNUIsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUywyQkFBMkI7QUFDcEMsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxpQkFBaUI7QUFFMUIsSUFBTyxzQkFBUSxhQUFhLE1BQU07QUFDaEMsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBO0FBQUEsTUFFTCxNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLElBQ1Q7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLE1BQU0sQ0FBQyxtQkFBbUI7QUFBQSxJQUM1QjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsVUFBVSxFQUFFLFVBQVUsTUFBTSxDQUFDO0FBQUEsTUFDN0IsVUFBVTtBQUFBLFFBQ1IsUUFBUTtBQUFBLFVBQ04sTUFBTTtBQUFBLFFBQ1I7QUFBQSxRQUNBLFVBQVU7QUFBQSxNQUNaLENBQUM7QUFBQSxNQUNELFNBQVM7QUFBQSxRQUNQLFFBQVE7QUFBQSxVQUNOLE1BQU07QUFBQSxVQUNOLFNBQVM7QUFBQSxRQUNYO0FBQUEsUUFDQSxPQUFPO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUjtBQUFBLFFBQ0EsVUFBVTtBQUFBLFFBQ1YsWUFBWTtBQUFBLFFBQ1osVUFBVTtBQUFBLFFBQ1YsVUFBVTtBQUFBLFVBQ1I7QUFBQSxZQUNFLE1BQU07QUFBQSxZQUNOLFNBQVM7QUFBQSxZQUNULFNBQVM7QUFBQSxjQUNQLFVBQVU7QUFBQSxZQUNa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
