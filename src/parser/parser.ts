import { ParseError } from 'error';
import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  UnaryExpr,
  VariableExpr,
} from 'parser/expr';
import {
  BlockStmt,
  ExpressionStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  Stmt,
  VarStmt,
  WhileStmt,
} from 'parser/stmt';
import { Token, TokenType } from 'scanner/token';

export class Parser {
  constructor(
    private tokens: Token[] = [],
    private current: number = 0,
    public hadError = false
  ) {}

  parse(): Stmt[] {
    const statements: Stmt[] = [];

    while (!this.isAtEnd()) {
      const statement = this.declaration();

      if (statement != null) {
        statements.push(statement);
      }
    }

    return statements;
  }

  private declaration(): Stmt | undefined {
    try {
      if (this.match(TokenType.FUN)) {
        return this.functionDeclaration('function');
      }
      if (this.match(TokenType.VAR)) {
        return this.varDeclaration();
      }

      return this.statement();
    } catch (error) {
      if (error instanceof ParseError) {
        this.synchronize();
      } else {
        console.error(error);
      }
      return undefined;
    }
  }

  private functionDeclaration(kind: string): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);
    this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);

    const params: Token[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (params.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 parameters.");
        }

        params.push(
          this.consume(TokenType.IDENTIFIER, 'Expect parameter name')
        );
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_PAREN, `Expect ')' after parameters.`);

    this.consume(TokenType.RIGHT_PAREN, `Expect '{' before ${kind} body.`);
    const body = this.blockStatement();

    return new FunctionStmt(name, params, body);
  }

  private varDeclaration(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, 'Expect variable name.');

    let initializer: Expr | undefined = undefined;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, 'Expect ";" after variable declaration.');
    return new VarStmt(name, initializer);
  }

  private statement(): Stmt {
    if (this.match(TokenType.PRINT)) {
      return this.printStatement();
    }
    if (this.match(TokenType.LEFT_BRACE)) {
      return this.blockStatement();
    }
    if (this.match(TokenType.IF)) {
      return this.ifStatement();
    }
    if (this.match(TokenType.WHILE)) {
      return this.whileStatement();
    }
    if (this.match(TokenType.FOR)) {
      return this.forStatement();
    }

    return this.expressionStatement();
  }

  private printStatement(): Stmt {
    const value = this.expression();

    this.consume(TokenType.SEMICOLON, 'Expect ";" after value.');

    return new PrintStmt(value);
  }

  private blockStatement(): Stmt {
    var statements: Stmt[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const statement = this.declaration();
      if (statement) {
        statements.push(statement);
      }
    }

    this.consume(TokenType.RIGHT_BRACE, 'Expect "}" after block.');

    return new BlockStmt(statements);
  }

  private ifStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, 'Expect "(" after "if".');
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, 'Expect ")" after if condition');

    const thenBranch = this.statement();
    let elseBranch = undefined;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return new IfStmt(condition, thenBranch, elseBranch);
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, 'Expect "(" after "while".');
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, 'Expect ")" after condition.');
    const body = this.statement();

    return new WhileStmt(condition, body);
  }

  private forStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, 'Expect "(" after "for".');

    let initializer;
    if (this.match(TokenType.SEMICOLON)) {
      initializer = undefined;
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition = undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, 'Expect ";" after loop condition.');

    let increment = undefined;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TokenType.RIGHT_PAREN, 'Expect ")" after for clauses.');

    let body = this.statement();

    if (increment != null) {
      body = new BlockStmt([body, new ExpressionStmt(increment)]);
    }

    if (condition == null) {
      condition = new LiteralExpr(true);
    }
    body = new WhileStmt(condition, body);

    if (initializer != null) {
      body = new BlockStmt([initializer, body]);
    }

    return body;
  }

  private expressionStatement(): Stmt {
    const expression = this.expression();

    this.consume(TokenType.SEMICOLON, 'Expect ";" after expression.');

    return new ExpressionStmt(expression);
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.or();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof VariableExpr) {
        const name = (expr as VariableExpr).name;
        return new AssignExpr(name, value);
      }

      this.error(equals, 'Invalid assignment target.');
    }

    return expr;
  }

  private or(): Expr {
    let expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = new LogicalExpr(expr, operator, right);
    }

    return expr;
  }

  private and(): Expr {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new LogicalExpr(expr, operator, right);
    }

    return expr;
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

    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: Expr): Expr {
    const args: Expr[] = [];

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 arguments.");
        }
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    const paren = this.consume(
      TokenType.RIGHT_PAREN,
      'Expect ")" after arguments.'
    );

    return new CallExpr(callee, paren, args);
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
    if (this.match(TokenType.IDENTIFIER)) {
      return new VariableExpr(this.previous());
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
    this.reportParserError(token, message);
    return new ParseError();
  }

  private reportParserError(token: Token, message: string) {
    if (token.type == TokenType.EOF) {
      this.reportParserErrorFormatted(token.line, ' at end', message);
    } else {
      this.reportParserErrorFormatted(
        token.line,
        ` at '${token.lexeme}'`,
        message
      );
    }
  }

  private reportParserErrorFormatted(
    line: number,
    where: string,
    message: string
  ) {
    console.error(`[line ${line}] Error ${where}: ${message}`);
    this.hadError = true;
  }
}
