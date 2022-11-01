import { reportParserError } from 'index';
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from 'parser/expr';
import { ExpressionStmt, PrintStmt, Stmt } from 'parser/stmt';
import { Token, TokenType } from 'scanner/token';

export class Parser {
  constructor(private tokens: Token[] = [], private current: number = 0) {}

  parse(): Stmt[] {
    const statements: Stmt[] = [];

    while (!this.isAtEnd()) {
      statements.push(this.statement());
    }

    return statements;
    // try {
    //   return this.expression();
    // } catch (error) {
    //   if (!(error instanceof ParseError)) {
    //     console.error(error);
    //   }
    //   return null;
    // }
  }

  private statement(): Stmt {
    if (this.match(TokenType.PRINT)) {
      return this.printStatement();
    }

    return this.expressionStatement();
  }

  private printStatement(): Stmt {
    const value = this.expression();

    this.consume(TokenType.SEMICOLON, 'Expect ";" after value.');

    return new PrintStmt(value);
  }

  private expressionStatement(): Stmt {
    const expression = this.expression();

    this.consume(TokenType.SEMICOLON, 'Expect ";" after expression.');

    return new ExpressionStmt(expression);
  }

  private expression(): Expr {
    return this.equality();
  }

  private equality(): Expr {
    let expression = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expression = new BinaryExpr(expression, operator, right);
    }

    return expression;
  }

  private comparison(): Expr {
    let expression = this.term();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const operator = this.previous();
      const right = this.term();
      expression = new BinaryExpr(expression, operator, right);
    }

    return expression;
  }

  private term(): Expr {
    let expression = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expression = new BinaryExpr(expression, operator, right);
    }

    return expression;
  }

  private factor(): Expr {
    let expression = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expression = new BinaryExpr(expression, operator, right);
    }

    return expression;
  }

  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new UnaryExpr(operator, right);
    }

    return this.primary();
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) {
      return new LiteralExpr(false);
    }
    if (this.match(TokenType.TRUE)) {
      return new LiteralExpr(true);
    }
    if (this.match(TokenType.NIL)) {
      return new LiteralExpr(null);
    }
    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new LiteralExpr(this.previous().literal);
    }
    if (this.match(TokenType.LEFT_PAREN)) {
      const expression = this.expression();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after expression.');
      return new GroupingExpr(expression);
    }
    throw this.error(this.peek(), 'Expect expression.');
  }

  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) {
        return;
      }

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
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
