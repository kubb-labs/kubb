import { describe, expect, it } from 'vitest'
import { createOutputBuilder, createOutputOrganizer, defineOutputStructure, OutputBuilder, OutputOrganizer } from './output.ts'

describe('output organization', () => {
  describe('OutputOrganizer', () => {
    it('should create organizer with root path', () => {
      const organizer = new OutputOrganizer('./gen')
      const structure = organizer.getStructure()

      expect(structure.path).toBe('./gen')
      expect(structure.files).toEqual([])
      expect(structure.subdirectories).toEqual([])
    })

    it('should add files to root', () => {
      const organizer = new OutputOrganizer()

      organizer.addFile({
        baseName: 'index.ts',
        path: './index.ts',
        content: 'export {}',
      })

      const files = organizer.getAllFiles()
      expect(files).toHaveLength(1)
      expect(files[0]?.baseName).toBe('index.ts')
    })

    it('should create directories automatically', () => {
      const organizer = new OutputOrganizer()

      organizer.addFile({
        baseName: 'user.ts',
        path: './models/user.ts',
        content: 'export type User = {}',
      })

      const dir = organizer.getDirectory('./models')
      expect(dir).toBeDefined()
      expect(dir?.files).toHaveLength(1)
    })

    it('should handle nested directories', () => {
      const organizer = new OutputOrganizer()

      organizer.addFile({
        baseName: 'index.ts',
        path: './src/models/user/index.ts',
      })

      const userDir = organizer.getDirectory('./src/models/user')
      expect(userDir).toBeDefined()
      expect(userDir?.files[0]?.baseName).toBe('index.ts')
    })

    it('should get all files', () => {
      const organizer = new OutputOrganizer()

      organizer.addFiles([
        { baseName: 'a.ts', path: './a.ts' },
        { baseName: 'b.ts', path: './models/b.ts' },
        { baseName: 'c.ts', path: './utils/c.ts' },
      ])

      const files = organizer.getAllFiles()
      expect(files).toHaveLength(3)
    })

    it('should get file paths', () => {
      const organizer = new OutputOrganizer()

      organizer.addFiles([
        { baseName: 'a.ts', path: './a.ts' },
        { baseName: 'b.ts', path: './models/b.ts' },
      ])

      const paths = organizer.getFilePaths()
      expect(paths).toContain('./a.ts')
      expect(paths).toContain('./models/b.ts')
    })

    it('should group files by directory', () => {
      const organizer = new OutputOrganizer()

      organizer.addFiles([
        { baseName: 'a.ts', path: 'a.ts' },
        { baseName: 'b.ts', path: 'b.ts' },
        { baseName: 'user.ts', path: 'models/user.ts' },
        { baseName: 'post.ts', path: 'models/post.ts' },
      ])

      const grouped = organizer.getFilesByDirectory()

      expect(grouped.get('.')?.length).toBe(2)
      expect(grouped.get('models')?.length).toBe(2)
    })
  })

  describe('OutputBuilder', () => {
    it('should build file structure declaratively', () => {
      const builder = new OutputBuilder()

      builder
        .file('index.ts', 'export {}')
        .directory('models', () => {
          builder.file('user.ts')
          builder.file('post.ts')
        })
        .directory('utils')
        .file('helper.ts')
        .up()

      const organizer = builder.build()
      const files = organizer.getAllFiles()

      expect(files).toHaveLength(4)
      expect(files.some((f) => f.baseName === 'index.ts')).toBe(true)
      expect(files.some((f) => f.path === 'models/user.ts')).toBe(true)
      expect(files.some((f) => f.path === 'utils/helper.ts')).toBe(true)
    })

    it('should handle nested directories', () => {
      const builder = new OutputBuilder()

      builder.directory('src').directory('components').file('Button.tsx').up().directory('utils').file('helpers.ts')

      const organizer = builder.build()
      const files = organizer.getAllFiles()

      expect(files.some((f) => f.path === 'src/components/Button.tsx')).toBe(true)
      expect(files.some((f) => f.path === 'src/utils/helpers.ts')).toBe(true)
    })

    it('should add multiple files at once', () => {
      const builder = new OutputBuilder()

      builder.files([
        { baseName: 'a.ts', content: 'export const a = 1' },
        { baseName: 'b.ts', content: 'export const b = 2' },
        { baseName: 'c.ts', content: 'export const c = 3' },
      ])

      const organizer = builder.build()
      expect(organizer.getAllFiles()).toHaveLength(3)
    })

    it('should support file metadata', () => {
      const builder = new OutputBuilder()

      builder.file('test.ts', 'content', { isTest: true })

      const organizer = builder.build()
      const file = organizer.getAllFiles()[0]

      expect(file?.metadata).toEqual({ isTest: true })
    })
  })

  describe('createOutputBuilder', () => {
    it('should create builder with root path', () => {
      const builder = createOutputBuilder('./gen')
      builder.file('index.ts')

      const organizer = builder.build()
      const files = organizer.getAllFiles()

      expect(files[0]?.path).toBe('gen/index.ts')
    })
  })

  describe('createOutputOrganizer', () => {
    it('should create organizer with root path', () => {
      const organizer = createOutputOrganizer('./output')
      const structure = organizer.getStructure()

      expect(structure.path).toBe('./output')
    })
  })

  describe('defineOutputStructure', () => {
    it('should create structure declaratively', () => {
      const organizer = defineOutputStructure('./gen', (builder) => {
        builder
          .file('index.ts')
          .directory('models', () => {
            builder.file('user.ts')
            builder.file('post.ts')
          })
          .directory('controllers', () => {
            builder.file('userController.ts')
            builder.file('postController.ts')
          })
      })

      const files = organizer.getAllFiles()
      expect(files).toHaveLength(5)
      expect(files.some((f) => f.path === 'gen/index.ts')).toBe(true)
      expect(files.some((f) => f.path === 'gen/models/user.ts')).toBe(true)
      expect(files.some((f) => f.path === 'gen/controllers/userController.ts')).toBe(true)
    })

    it('should handle complex structures', () => {
      const organizer = defineOutputStructure('./src', (builder) => {
        builder
          .directory('api', () => {
            builder
              .directory('v1', () => {
                builder.file('users.ts')
                builder.file('posts.ts')
              })
              .directory('v2', () => {
                builder.file('users.ts')
              })
          })
          .directory('types', () => {
            builder.file('index.ts')
          })
      })

      const files = organizer.getAllFiles()
      expect(files).toHaveLength(4)
      expect(files.some((f) => f.path === 'src/api/v1/users.ts')).toBe(true)
      expect(files.some((f) => f.path === 'src/api/v2/users.ts')).toBe(true)
      expect(files.some((f) => f.path === 'src/types/index.ts')).toBe(true)
    })
  })
})
