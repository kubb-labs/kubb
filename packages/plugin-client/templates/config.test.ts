import { describe, expect, it } from 'vitest'
import { buildFormData } from './config'

describe('buildFormData', () => {
  describe('primitive types', () => {
    it('should handle string values', () => {
      const data = { name: 'John Doe' }
      const formData = buildFormData(data)

      expect(formData.get('name')).toBe('John Doe')
    })

    it('should handle number values', () => {
      const data = { age: 25, count: 0 }
      const formData = buildFormData(data)

      expect(formData.get('age')).toBe('25')
      expect(formData.get('count')).toBe('0')
    })

    it('should handle boolean values', () => {
      const data = { isActive: true, isDeleted: false }
      const formData = buildFormData(data)

      expect(formData.get('isActive')).toBe('true')
      expect(formData.get('isDeleted')).toBe('false')
    })
  })

  describe('special types', () => {
    it('should handle Blob values', () => {
      const blob = new Blob(['content'], { type: 'text/plain' })
      const data = { file: blob }
      const formData = buildFormData(data)

      const result = formData.get('file')
      // In Node.js, FormData converts Blob to File, but File extends Blob
      expect(result).toBeInstanceOf(Blob)
      // Check that it's the same content (not JSON.stringified)
      expect(result).not.toBeTypeOf('string')
    })

    it('should handle File values', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const data = { document: file }
      const formData = buildFormData(data)

      const result = formData.get('document')
      expect(result).toBeInstanceOf(File)
      expect(result).toBe(file)
    })

    it('should handle Date values', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      const data = { createdAt: date }
      const formData = buildFormData(data)

      expect(formData.get('createdAt')).toBe('2024-01-15T10:30:00.000Z')
    })

    it('should handle object values', async () => {
      const data = { metadata: { author: 'John', version: 1 } }
      const formData = buildFormData(data)

      expect(formData.get('metadata')).toBeInstanceOf(Blob)
      expect(await (formData.get('metadata') as Blob).text()).toBe('{"author":"John","version":1}')
    })
  })

  describe('array handling', () => {
    it('should handle string arrays', () => {
      const data = { tags: ['javascript', 'typescript', 'kubb'] }
      const formData = buildFormData(data)

      const tags = formData.getAll('tags')
      expect(tags).toHaveLength(3)
      expect(tags).toEqual(['javascript', 'typescript', 'kubb'])
    })

    it('should handle number arrays', () => {
      const data = { scores: [10, 20, 30] }
      const formData = buildFormData(data)

      const scores = formData.getAll('scores')
      expect(scores).toHaveLength(3)
      expect(scores).toEqual(['10', '20', '30'])
    })

    it('should handle boolean arrays', () => {
      const data = { flags: [true, false, true] }
      const formData = buildFormData(data)

      const flags = formData.getAll('flags')
      expect(flags).toHaveLength(3)
      expect(flags).toEqual(['true', 'false', 'true'])
    })

    it('should handle File arrays', () => {
      const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' })
      const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' })
      const data = { files: [file1, file2] }
      const formData = buildFormData(data)

      const files = formData.getAll('files')
      expect(files).toHaveLength(2)
      expect(files[0]).toBeInstanceOf(File)
      expect(files[1]).toBeInstanceOf(File)
      expect(files[0]).toBe(file1)
      expect(files[1]).toBe(file2)
    })

    it('should handle mixed type arrays', () => {
      const data = { items: ['string', 123, true] }
      const formData = buildFormData(data)

      const items = formData.getAll('items')
      expect(items).toHaveLength(3)
      expect(items).toEqual(['string', '123', 'true'])
    })

    it('should handle empty arrays', () => {
      const data = { emptyArray: [] }
      const formData = buildFormData(data)

      const items = formData.getAll('emptyArray')
      expect(items).toHaveLength(0)
    })

    it('should filter out null values in arrays', () => {
      const data = { tags: ['valid', null, 'another'] }
      const formData = buildFormData(data)

      const tags = formData.getAll('tags')
      expect(tags).toHaveLength(2)
      expect(tags).toEqual(['valid', 'another'])
    })

    it('should filter out undefined values in arrays', () => {
      const data = { tags: ['valid', undefined, 'another'] }
      const formData = buildFormData(data)

      const tags = formData.getAll('tags')
      expect(tags).toHaveLength(2)
      expect(tags).toEqual(['valid', 'another'])
    })

    it('should filter out both null and undefined in arrays', () => {
      const data = { tags: ['first', null, 'middle', undefined, 'last'] }
      const formData = buildFormData(data)

      const tags = formData.getAll('tags')
      expect(tags).toHaveLength(3)
      expect(tags).toEqual(['first', 'middle', 'last'])
    })
  })

  describe('null and undefined handling', () => {
    it('should skip null values', () => {
      const data = { name: 'John', age: null }
      const formData = buildFormData(data)

      expect(formData.get('name')).toBe('John')
      expect(formData.has('age')).toBe(false)
    })

    it('should skip undefined values', () => {
      const data = { name: 'John', age: undefined }
      const formData = buildFormData(data)

      expect(formData.get('name')).toBe('John')
      expect(formData.has('age')).toBe(false)
    })

    it('should handle all null/undefined values', () => {
      const data = { field1: null, field2: undefined }
      const formData = buildFormData(data)

      expect(Array.from(formData.keys())).toHaveLength(0)
    })
  })

  describe('complex scenarios', () => {
    it('should handle mixed data types', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const date = new Date('2024-01-15T10:30:00.000Z')
      const data = {
        title: 'Upload',
        count: 5,
        isPublic: true,
        file: file,
        createdAt: date,
        tags: ['tag1', 'tag2'],
        metadata: { author: 'John' },
      }
      const formData = buildFormData(data)

      expect(formData.get('title')).toBe('Upload')
      expect(formData.get('count')).toBe('5')
      expect(formData.get('isPublic')).toBe('true')
      expect(formData.get('file')).toBe(file)
      expect(formData.get('createdAt')).toBe('2024-01-15T10:30:00.000Z')
      expect(formData.getAll('tags')).toEqual(['tag1', 'tag2'])
      expect(formData.get('metadata')).toBeInstanceOf(Blob)
      expect(await (formData.get('metadata') as Blob).text()).toBe('{"author":"John"}')
    })

    it('should handle nested objects in arrays', async () => {
      const data = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      }
      const formData = buildFormData(data)

      const items = formData.getAll('items')
      expect(items).toHaveLength(2)
      expect(items[0]).toBeInstanceOf(Blob)
      expect(items[1]).toBeInstanceOf(Blob)
      expect(await (items[0] as Blob).text()).toBe('{"id":1,"name":"Item 1"}')
      expect(await (items[1] as Blob).text()).toBe('{"id":2,"name":"Item 2"}')
    })

    it('should handle array of Files with metadata', () => {
      const file1 = new File(['content1'], 'doc1.pdf', { type: 'application/pdf' })
      const file2 = new File(['content2'], 'doc2.pdf', { type: 'application/pdf' })
      const data = {
        files: [file1, file2],
        category: 'documents',
        uploadDate: new Date('2024-01-15T10:30:00.000Z'),
      }
      const formData = buildFormData(data)

      const files = formData.getAll('files')
      expect(files).toHaveLength(2)
      expect(files[0]).toBe(file1)
      expect(files[1]).toBe(file2)
      expect(formData.get('category')).toBe('documents')
      expect(formData.get('uploadDate')).toBe('2024-01-15T10:30:00.000Z')
    })
  })

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const data = {}
      const formData = buildFormData(data)

      expect(Array.from(formData.keys())).toHaveLength(0)
    })

    it('should handle null data', () => {
      const data = null
      const formData = buildFormData(data)

      expect(Array.from(formData.keys())).toHaveLength(0)
    })

    it('should handle undefined data', () => {
      const data = undefined
      const formData = buildFormData(data)

      expect(Array.from(formData.keys())).toHaveLength(0)
    })

    it('should handle empty strings', () => {
      const data = { name: '' }
      const formData = buildFormData(data)

      expect(formData.get('name')).toBe('')
    })

    it('should handle zero values', () => {
      const data = { count: 0 }
      const formData = buildFormData(data)

      expect(formData.get('count')).toBe('0')
    })

    it('should handle false boolean', () => {
      const data = { isActive: false }
      const formData = buildFormData(data)

      expect(formData.get('isActive')).toBe('false')
    })
  })

  describe('type safety and control flow', () => {
    it('should not append Blob twice (Blob should not fall through to object check)', () => {
      const blob = new Blob(['content'], { type: 'text/plain' })
      const data = { file: blob }
      const formData = buildFormData(data)

      // Should only have one entry for 'file'
      const entries = formData.getAll('file')
      expect(entries).toHaveLength(1)
      expect(entries[0]).toBeInstanceOf(Blob)
      // Should NOT be JSON.stringified
      expect(typeof entries[0]).not.toBe('string')
    })

    it('should not append Date twice (Date should not fall through to object check)', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      const data = { timestamp: date }
      const formData = buildFormData(data)

      // Should only have one entry for 'timestamp'
      const entries = formData.getAll('timestamp')
      expect(entries).toHaveLength(1)
      expect(entries[0]).toBe('2024-01-15T10:30:00.000Z')
      // Should NOT be JSON.stringified with quotes
      expect(entries[0]).not.toContain('{')
    })

    it('should handle array with only null/undefined values', () => {
      const data = { tags: [null, undefined, null] }
      const formData = buildFormData(data)

      const tags = formData.getAll('tags')
      expect(tags).toHaveLength(0)
    })
  })

  describe('real-world scenarios', () => {
    it('should handle file upload with metadata', () => {
      const file = new File(['pdf content'], 'document.pdf', { type: 'application/pdf' })
      const data = {
        file: file,
        title: 'Important Document',
        description: 'This is a test document',
        tags: ['work', 'important'],
        isPublic: false,
        uploadDate: new Date('2024-01-15T10:30:00.000Z'),
      }
      const formData = buildFormData(data)

      expect(formData.get('file')).toBe(file)
      expect(formData.get('title')).toBe('Important Document')
      expect(formData.get('description')).toBe('This is a test document')
      expect(formData.getAll('tags')).toEqual(['work', 'important'])
      expect(formData.get('isPublic')).toBe('false')
      expect(formData.get('uploadDate')).toBe('2024-01-15T10:30:00.000Z')
    })

    it('should handle multiple file upload', () => {
      const files = [
        new File(['content1'], 'file1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'file2.jpg', { type: 'image/jpeg' }),
        new File(['content3'], 'file3.jpg', { type: 'image/jpeg' }),
      ]
      const data = {
        files: files,
        albumName: 'Vacation Photos',
        year: 2024,
      }
      const formData = buildFormData(data)

      const uploadedFiles = formData.getAll('files')
      expect(uploadedFiles).toHaveLength(3)
      uploadedFiles.forEach((file, index) => {
        expect(file).toBeInstanceOf(File)
        expect(file).toBe(files[index])
      })
      expect(formData.get('albumName')).toBe('Vacation Photos')
      expect(formData.get('year')).toBe('2024')
    })

    it('should handle API request with optional fields', () => {
      const data = {
        title: 'Post Title',
        content: 'Post content here',
        tags: ['blog', 'tech'],
        publishDate: undefined, // Optional field not provided
        isDraft: false,
        metadata: null, // Optional field explicitly null
      }
      const formData = buildFormData(data)

      expect(formData.get('title')).toBe('Post Title')
      expect(formData.get('content')).toBe('Post content here')
      expect(formData.getAll('tags')).toEqual(['blog', 'tech'])
      expect(formData.has('publishDate')).toBe(false)
      expect(formData.get('isDraft')).toBe('false')
      expect(formData.has('metadata')).toBe(false)
    })

    it('should handle form with array containing files and strings', () => {
      const file1 = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
      const file2 = new File(['image'], 'pic.jpg', { type: 'image/jpeg' })
      const data = {
        attachments: [file1, file2],
        labels: ['urgent', 'review-needed'],
        priority: 1,
      }
      const formData = buildFormData(data)

      const attachments = formData.getAll('attachments')
      expect(attachments).toHaveLength(2)
      expect(attachments[0]).toBe(file1)
      expect(attachments[1]).toBe(file2)

      const labels = formData.getAll('labels')
      expect(labels).toEqual(['urgent', 'review-needed'])
      expect(formData.get('priority')).toBe('1')
    })

    it('should handle sparse arrays with null/undefined', () => {
      const file = new File(['content'], 'valid.txt', { type: 'text/plain' })
      const data = {
        files: [file, null, undefined],
        tags: ['tag1', null, 'tag2', undefined, 'tag3'],
      }
      const formData = buildFormData(data)

      const files = formData.getAll('files')
      expect(files).toHaveLength(1)
      expect(files[0]).toBe(file)

      const tags = formData.getAll('tags')
      expect(tags).toHaveLength(3)
      expect(tags).toEqual(['tag1', 'tag2', 'tag3'])
    })
  })

  describe('type coercion and edge cases', () => {
    it('should handle numeric string values', () => {
      const data = { id: '123' }
      const formData = buildFormData(data)

      expect(formData.get('id')).toBe('123')
    })

    it('should handle special characters in strings', () => {
      const data = { text: 'Hello "World" & <Friends>' }
      const formData = buildFormData(data)

      expect(formData.get('text')).toBe('Hello "World" & <Friends>')
    })

    it('should handle unicode characters', () => {
      const data = { message: '你好世界 🌍' }
      const formData = buildFormData(data)

      expect(formData.get('message')).toBe('你好世界 🌍')
    })

    it('should handle nested objects', async () => {
      const data = {
        user: {
          name: 'John',
          address: {
            city: 'New York',
            zip: '10001',
          },
        },
      }
      const formData = buildFormData(data)

      expect(formData.get('user')).toBeInstanceOf(Blob)
      expect(await (formData.get('user') as Blob).text()).toBe('{"name":"John","address":{"city":"New York","zip":"10001"}}')
    })

    it('should handle arrays with objects', async () => {
      const data = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      }
      const formData = buildFormData(data)

      const users = formData.getAll('users')
      expect(users).toHaveLength(2)
      expect(users[0]).toBeInstanceOf(Blob)
      expect(users[1]).toBeInstanceOf(Blob)
      expect(await (users[0] as Blob).text()).toBe('{"id":1,"name":"Alice"}')
      expect(await (users[1] as Blob).text()).toBe('{"id":2,"name":"Bob"}')
    })

    it('should handle arrays with Dates', () => {
      const dates = [new Date('2024-01-01'), new Date('2024-01-02'), new Date('2024-01-03')]
      const data = { dates: dates }
      const formData = buildFormData(data)

      const result = formData.getAll('dates')
      expect(result).toHaveLength(3)
      expect(result[0]).toBe('2024-01-01T00:00:00.000Z')
      expect(result[1]).toBe('2024-01-02T00:00:00.000Z')
      expect(result[2]).toBe('2024-01-03T00:00:00.000Z')
    })
  })

  describe('performance and large data', () => {
    it('should handle large arrays efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => `item-${i}`)
      const data = { items: largeArray }
      const formData = buildFormData(data)

      const items = formData.getAll('items')
      expect(items).toHaveLength(1000)
      expect(items[0]).toBe('item-0')
      expect(items[999]).toBe('item-999')
    })

    it('should handle many fields', () => {
      const data = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`field${i}`, `value${i}`]))
      const formData = buildFormData(data)

      expect(Array.from(formData.keys())).toHaveLength(100)
      expect(formData.get('field0')).toBe('value0')
      expect(formData.get('field99')).toBe('value99')
    })
  })

  describe('FormData instance', () => {
    it('should return a FormData instance', () => {
      const data = { name: 'test' }
      const formData = buildFormData(data)

      expect(formData).toBeInstanceOf(FormData)
    })

    it('should return an empty FormData for empty input', () => {
      const formData = buildFormData({})

      expect(formData).toBeInstanceOf(FormData)
      expect(Array.from(formData.keys())).toHaveLength(0)
    })
  })
})
