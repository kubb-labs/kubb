/**
 * JavaScript and Java reserved words.
 * @link https://github.com/jonschlinkert/reserved/blob/master/index.js
 */
const reservedWords = new Set([
  "abstract",
  "arguments",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "double",
  "else",
  "enum",
  "eval",
  "export",
  "extends",
  "false",
  "final",
  "finally",
  "float",
  "for",
  "function",
  "goto",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "int",
  "interface",
  "let",
  "long",
  "native",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "volatile",
  "while",
  "with",
  "yield",
  "Array",
  "Date",
  "hasOwnProperty",
  "Infinity",
  "isFinite",
  "isNaN",
  "isPrototypeOf",
  "length",
  "Math",
  "name",
  "NaN",
  "Number",
  "Object",
  "prototype",
  "String",
  "toString",
  "undefined",
  "valueOf",
] as const);

/**
 * Prefixes `word` with `_` when it is a reserved JavaScript/Java identifier or starts with a digit.
 *
 * @example
 * ```ts
 * transformReservedWord('class')  // '_class'
 * transformReservedWord('42foo')  // '_42foo'
 * transformReservedWord('status') // 'status'
 * ```
 */
export function transformReservedWord(word: string): string {
  const firstChar = word.charCodeAt(0);
  if (
    word &&
    (reservedWords.has(word as "valueOf") ||
      (firstChar >= 48 && firstChar <= 57))
  ) {
    return `_${word}`;
  }
  return word;
}

/**
 * Returns `true` when `name` is a syntactically valid JavaScript variable name.
 *
 * @example
 * ```ts
 * isValidVarName('status')  // true
 * isValidVarName('class')   // false (reserved word)
 * isValidVarName('42foo')   // false (starts with digit)
 * ```
 */
export function isValidVarName(name: string): boolean {
  try {
    new Function(`var ${name}`);
  } catch {
    return false;
  }
  return true;
}
