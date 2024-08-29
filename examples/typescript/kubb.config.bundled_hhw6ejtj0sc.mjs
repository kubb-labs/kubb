// kubb.config.ts
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import ts, { factory } from 'typescript'
const kubb_config_default = defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ validate: false }),
    pluginTs({
      output: {
        path: 'models.ts',
        exportAs: 'models',
      },
      enumType: 'enum',
    }),
    pluginTs({
      output: {
        path: 'modelsConst.ts',
        exportAs: 'modelsAsConst',
      },
      enumType: 'asConst',
    }),
    pluginTs({
      output: {
        path: 'modelsPascalConst.ts',
        exportAs: 'modelsPascalConst',
      },
      enumType: 'asPascalConst',
    }),
    pluginTs({
      output: {
        path: 'modelsConstEnum.ts',
        exportAs: 'modelsConstEnum',
      },
      enumType: 'constEnum',
    }),
    pluginTs({
      output: {
        path: 'modelsLiteral.ts',
        exportAs: 'modelsLiteral',
      },
      enumType: 'literal',
    }),
    pluginTs({
      output: {
        path: 'ts/models',
        exportType: 'barrelNamed',
      },
      oasType: 'infer',
      mapper: {
        category: factory.createPropertySignature(
          void 0,
          factory.createIdentifier('category'),
          factory.createToken(ts.SyntaxKind.QuestionToken),
          factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        ),
      },
    }),
  ],
})
export { kubb_config_default as default }
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsia3ViYi5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL1VzZXJzL3N0aWpudmFuaHVsbGUvR2l0SHViL2t1YmIvZXhhbXBsZXMvdHlwZXNjcmlwdC9rdWJiLmNvbmZpZy50c1wiO2NvbnN0IF9faW5qZWN0ZWRfZGlybmFtZV9fID0gXCIvVXNlcnMvc3Rpam52YW5odWxsZS9HaXRIdWIva3ViYi9leGFtcGxlcy90eXBlc2NyaXB0XCI7Y29uc3QgX19pbmplY3RlZF9pbXBvcnRfbWV0YV91cmxfXyA9IFwiZmlsZTovLy9Vc2Vycy9zdGlqbnZhbmh1bGxlL0dpdEh1Yi9rdWJiL2V4YW1wbGVzL3R5cGVzY3JpcHQva3ViYi5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICdAa3ViYi9jb3JlJ1xuaW1wb3J0IHsgcGx1Z2luT2FzIH0gZnJvbSAnQGt1YmIvcGx1Z2luLW9hcydcbmltcG9ydCB7IHBsdWdpblRzIH0gZnJvbSAnQGt1YmIvcGx1Z2luLXRzJ1xuaW1wb3J0IHRzLCB7IGZhY3RvcnkgfSBmcm9tICd0eXBlc2NyaXB0J1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICByb290OiAnLicsXG4gIGlucHV0OiB7XG4gICAgcGF0aDogJy4vcGV0U3RvcmUueWFtbCcsXG4gIH0sXG4gIG91dHB1dDoge1xuICAgIHBhdGg6ICcuL3NyYy9nZW4nLFxuICAgIGNsZWFuOiB0cnVlLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcGx1Z2luT2FzKHsgdmFsaWRhdGU6IGZhbHNlIH0pLFxuICAgIHBsdWdpblRzKHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBwYXRoOiAnbW9kZWxzLnRzJyxcbiAgICAgICAgZXhwb3J0QXM6ICdtb2RlbHMnLFxuICAgICAgfSxcbiAgICAgIGVudW1UeXBlOiAnZW51bScsXG4gICAgfSksXG4gICAgcGx1Z2luVHMoe1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIHBhdGg6ICdtb2RlbHNDb25zdC50cycsXG4gICAgICAgIGV4cG9ydEFzOiAnbW9kZWxzQXNDb25zdCcsXG4gICAgICB9LFxuICAgICAgZW51bVR5cGU6ICdhc0NvbnN0JyxcbiAgICB9KSxcbiAgICBwbHVnaW5Ucyh7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgcGF0aDogJ21vZGVsc1Bhc2NhbENvbnN0LnRzJyxcbiAgICAgICAgZXhwb3J0QXM6ICdtb2RlbHNQYXNjYWxDb25zdCcsXG4gICAgICB9LFxuICAgICAgZW51bVR5cGU6ICdhc1Bhc2NhbENvbnN0JyxcbiAgICB9KSxcbiAgICBwbHVnaW5Ucyh7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgcGF0aDogJ21vZGVsc0NvbnN0RW51bS50cycsXG4gICAgICAgIGV4cG9ydEFzOiAnbW9kZWxzQ29uc3RFbnVtJyxcbiAgICAgIH0sXG4gICAgICBlbnVtVHlwZTogJ2NvbnN0RW51bScsXG4gICAgfSksXG4gICAgcGx1Z2luVHMoe1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIHBhdGg6ICdtb2RlbHNMaXRlcmFsLnRzJyxcbiAgICAgICAgZXhwb3J0QXM6ICdtb2RlbHNMaXRlcmFsJyxcbiAgICAgIH0sXG4gICAgICBlbnVtVHlwZTogJ2xpdGVyYWwnLFxuICAgIH0pLFxuICAgIHBsdWdpblRzKHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBwYXRoOiAndHMvbW9kZWxzJyxcbiAgICAgICAgZXhwb3J0VHlwZTogJ2JhcnJlbE5hbWVkJyxcbiAgICAgIH0sXG4gICAgICBvYXNUeXBlOiAnaW5mZXInLFxuICAgICAgbWFwcGVyOiB7XG4gICAgICAgIGNhdGVnb3J5OiBmYWN0b3J5LmNyZWF0ZVByb3BlcnR5U2lnbmF0dXJlKFxuICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICBmYWN0b3J5LmNyZWF0ZUlkZW50aWZpZXIoJ2NhdGVnb3J5JyksXG4gICAgICAgICAgZmFjdG9yeS5jcmVhdGVUb2tlbih0cy5TeW50YXhLaW5kLlF1ZXN0aW9uVG9rZW4pLFxuICAgICAgICAgIGZhY3RvcnkuY3JlYXRlS2V5d29yZFR5cGVOb2RlKHRzLlN5bnRheEtpbmQuU3RyaW5nS2V5d29yZCksXG4gICAgICAgICksXG4gICAgICB9LFxuICAgIH0pLFxuICBdLFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMFMsU0FBUyxvQkFBb0I7QUFDdlUsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxnQkFBZ0I7QUFDekIsT0FBTyxNQUFNLGVBQWU7QUFFNUIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBLEVBQ04sT0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxVQUFVLEVBQUUsVUFBVSxNQUFNLENBQUM7QUFBQSxJQUM3QixTQUFTO0FBQUEsTUFDUCxRQUFRO0FBQUEsUUFDTixNQUFNO0FBQUEsUUFDTixVQUFVO0FBQUEsTUFDWjtBQUFBLE1BQ0EsVUFBVTtBQUFBLElBQ1osQ0FBQztBQUFBLElBQ0QsU0FBUztBQUFBLE1BQ1AsUUFBUTtBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sVUFBVTtBQUFBLE1BQ1o7QUFBQSxNQUNBLFVBQVU7QUFBQSxJQUNaLENBQUM7QUFBQSxJQUNELFNBQVM7QUFBQSxNQUNQLFFBQVE7QUFBQSxRQUNOLE1BQU07QUFBQSxRQUNOLFVBQVU7QUFBQSxNQUNaO0FBQUEsTUFDQSxVQUFVO0FBQUEsSUFDWixDQUFDO0FBQUEsSUFDRCxTQUFTO0FBQUEsTUFDUCxRQUFRO0FBQUEsUUFDTixNQUFNO0FBQUEsUUFDTixVQUFVO0FBQUEsTUFDWjtBQUFBLE1BQ0EsVUFBVTtBQUFBLElBQ1osQ0FBQztBQUFBLElBQ0QsU0FBUztBQUFBLE1BQ1AsUUFBUTtBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sVUFBVTtBQUFBLE1BQ1o7QUFBQSxNQUNBLFVBQVU7QUFBQSxJQUNaLENBQUM7QUFBQSxJQUNELFNBQVM7QUFBQSxNQUNQLFFBQVE7QUFBQSxRQUNOLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxNQUNkO0FBQUEsTUFDQSxTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsUUFDTixVQUFVLFFBQVE7QUFBQSxVQUNoQjtBQUFBLFVBQ0EsUUFBUSxpQkFBaUIsVUFBVTtBQUFBLFVBQ25DLFFBQVEsWUFBWSxHQUFHLFdBQVcsYUFBYTtBQUFBLFVBQy9DLFFBQVEsc0JBQXNCLEdBQUcsV0FBVyxhQUFhO0FBQUEsUUFDM0Q7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
