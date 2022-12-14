export enum TokenType {
  // Single-character tokens
  LEFT_PAREN = '(',
  RIGHT_PAREN = ')',
  LEFT_BRACE = '{',
  RIGHT_BRACE = '}',
  COMMA = ',',
  DOT = '.',
  MINUS = '-',
  PLUS = '+',
  SEMICOLON = ';',
  SLASH = '/',
  STAR = '*',

  // One or two character tokens
  BANG = '!',
  BANG_EQUAL = '!=',
  EQUAL = '=',
  EQUAL_EQUAL = '==',
  GREATER = '>',
  GREATER_EQUAL = '>=',
  LESS = '<',
  LESS_EQUAL = '<=',

  // Literals
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',

  // Keywords
  AND = 'AND',
  CLASS = 'CLASS',
  ELSE = 'ELSE',
  FALSE = 'FALSE',
  FUN = 'FUN',
  FOR = 'FOR',
  IF = 'IF',
  NIL = 'NIL',
  OR = 'OR',
  PRINT = 'PRINT',
  RETURN = 'RETURN',
  SUPER = 'SUPER',
  THIS = 'THIS',
  TRUE = 'TRUE',
  VAR = 'VAR',
  WHILE = 'WHILE',

  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  lexeme: string;
  literal?: any;
  line: number;
}

export const keywords = new Map<string, TokenType>([
  ['and', TokenType.AND],
  ['class', TokenType.CLASS],
  ['else', TokenType.ELSE],
  ['false', TokenType.FALSE],
  ['for', TokenType.FOR],
  ['fun', TokenType.FUN],
  ['if', TokenType.IF],
  ['nil', TokenType.NIL],
  ['or', TokenType.OR],
  ['print', TokenType.PRINT],
  ['return', TokenType.RETURN],
  ['super', TokenType.SUPER],
  ['this', TokenType.THIS],
  ['true', TokenType.TRUE],
  ['var', TokenType.VAR],
  ['while', TokenType.WHILE],
]);
