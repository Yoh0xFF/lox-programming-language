import { error } from '..';
import { Token, TokenType, keywords } from './token';

export class Scanner {
  private source: string;
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;

  constructor(source: string) {
    this.source = source;
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      // We are at the beginning of the next lexeme.
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      lexeme: '',
      line: this.line,
    });

    return this.tokens;
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private scanToken() {
    const c = this.advance();

    switch (c) {
      case ' ':
      case '\r':
      case '\t':
        break;
      case '\n':
        this.line++;
        break;
      case '(':
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ')':
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case ')':
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case '{':
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case '}':
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ',':
        this.addToken(TokenType.COMMA);
        break;
      case '.':
        this.addToken(TokenType.DOT);
        break;
      case '-':
        this.addToken(TokenType.MINUS);
        break;
      case '+':
        this.addToken(TokenType.PLUS);
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON);
        break;
      case '*':
        this.addToken(TokenType.STAR);
        break;
      case '!':
        this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case '=':
        this.addToken(
          this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
        );
        break;
      case '<':
        this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case '>':
        this.addToken(
          this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;
      case '/':
        if (this.match('/')) {
          // A comment goes until the end of tle line
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case '"':
        this.string();
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          error(this.line, `Unexpected character: ${c}`);
        }
    }
  }

  private advance(): string {
    this.current++;
    return this.source[this.current - 1];
  }

  private peek(): string {
    if (this.isAtEnd()) {
      return '\0';
    }
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) {
      return '\0';
    }

    return this.source[this.current + 1];
  }

  private match(expected: string): boolean {
    if (this.isAtEnd() || this.source.charAt(this.current) != expected) {
      return false;
    }

    this.current++;
    return true;
  }

  private addToken(type: TokenType, literal: any = undefined) {
    const lexeme = this.source.substring(this.start, this.current);
    this.tokens.push({
      type,
      lexeme,
      literal,
      line: this.line,
    });
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() == '\n') {
        this.line++;
      }

      this.advance();
    }

    if (this.isAtEnd()) {
      error(this.line, 'Unterminates string');
      return;
    }

    // Skip the closing quote
    this.advance();

    // Trim the surrounding quotes.
    const literal = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, literal);
  }

  private number() {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance();
    }

    while (this.isDigit(this.peek())) {
      this.advance();
    }

    this.addToken(
      TokenType.NUMBER,
      Number.parseFloat(this.source.substring(this.start, this.current))
    );
  }

  private identifier() {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const lexeme = this.source.substring(this.start, this.current);
    this.addToken(keywords.get(lexeme) ?? TokenType.IDENTIFIER);
  }
}
