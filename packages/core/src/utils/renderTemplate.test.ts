import { renderTemplate } from './renderTemplate.ts'

describe('renderTemplate', () => {
  test('template rendering', () => {
    expect(renderTemplate('{{name}}', { name: 'pet' })).toBe('pet')
    expect(renderTemplate('{{name}}Service', { name: 'pet' })).toBe('petService')
    expect(renderTemplate('{{name}}Service')).toBe('Service')
    expect(renderTemplate('{{name}}Service', {})).toBe('Service')
    expect(renderTemplate('Service')).toBe('Service')

    expect(renderTemplate('./test/{{name}}Service', { name: '' })).toBe('./test/Service')
    expect(renderTemplate('./test/{{name}}Service hello', { name: '' })).toBe('./test/Service hello')

    expect(
      renderTemplate("{{ button: { position: 'relative' } }}", {
        fields: 'fields',
      }),
    ).toBe("{{ button: { position: 'relative' } }}")
    expect(
      renderTemplate("{{fields}} {{ button: { position: 'relative' } }}", {
        fields: 'fieldA',
      }),
    ).toBe("fieldA {{ button: { position: 'relative' } }}")
    expect(
      renderTemplate("{{ button: { position: 'relative' } }}{{fields}} ", {
        fields: 'fieldB',
      }),
    ).toBe("{{ button: { position: 'relative' } }}fieldB")
  })
})
