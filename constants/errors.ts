export const ERROR_MAP = {
  '#DIV/0!': 'Division by zero',
  '#VALUE!': 'Wrong type of argument',
  '#REF!': 'Reference not valid',
  '#NAME?': 'Unknown function',
  '#CYCLE!': 'Circular reference',
  '#NA!': 'Value not available',
} as const;

export type ErrorCode = keyof typeof ERROR_MAP;