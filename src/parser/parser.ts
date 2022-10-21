import { reportParserError } from 'index';
import { Token, TokenType } from 'scanner/token';

export class Parser {
  constructor(private tokens: Token[] = [], private current: number = 0) {}

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.match(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }

    throw this.error(this.peek(), message);
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return false;
    }
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private error(token: Token, message: string): ParseError {
    reportParserError(token, message);
    return new ParseError();
  }
}

export class ParseError {}
