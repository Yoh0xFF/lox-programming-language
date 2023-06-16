import {ParseError} from 'error';
import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GetExpr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  SetExpr,
  UnaryExpr,
  VariableExpr,
} from 'parser/expr';
import {
  BlockStmt,
  ClassStmt,
  ExprStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  Stmt,
  VarStmt,
  WhileStmt,
} from 'parser/stmt';
import {Token, TokenType} from 'scanner/token';

export class Parser {
  constructor(
    private tokens: Token[] = [],
    private current: number = 0,
    public hadError = false
  ) {}

  parse(): Stmt[] {
    const stmts: Stmt[] = [];

    while (!this.isAtEnd()) {
      const stmt = this.declaration();

      if (stmt != null) {
        stmts.push(stmt);
      }
    }

    return stmts;
  }

  private declaration(): Stmt | undefined {
    try {
      if (this.match(TokenType.CLASS)) {
        return this.classDeclaration();
      }
      if (this.match(TokenType.FUN)) {
        return this.functionDeclaration('function');
      }
      if (this.match(TokenType.VAR)) {
        return this.varDeclaration();
      }

      return this.stmt();
    } catch (error) {
      if (error instanceof ParseError) {
        this.synchronize();
      } else {
        console.error(error);
      }
      return undefined;
    }
  }

  private classDeclaration(): ClassStmt {
    const name = this.consume(TokenType.IDENTIFIER, 'Expect class name.');
    this.consume(TokenType.LEFT_BRACE, 'Expect "{" before class body.');

    const methods: FunctionStmt[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      methods.push(this.functionDeclaration('method'));
    }

    this.consume(TokenType.RIGHT_BRACE, 'Expect "}" after class body.');

    return new ClassStmt(name, methods);
  }

  private functionDeclaration(kind: string): FunctionStmt {
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

    this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);
    const body = this.blockStmt() as BlockStmt;

    return new FunctionStmt(name, params, body.stmts);
  }

  private varDeclaration(): VarStmt {
    const name = this.consume(TokenType.IDENTIFIER, 'Expect variable name.');

    let initializer: Expr | undefined = undefined;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expr();
    }

    this.consume(TokenType.SEMICOLON, 'Expect ";" after variable declaration.');
    return new VarStmt(name, initializer);
  }

  private stmt(): Stmt {
    if (this.match(TokenType.PRINT)) {
      return this.printStmt();
    }
    if (this.match(TokenType.RETURN)) {
      return this.returnStmt();
    }
    if (this.match(TokenType.LEFT_BRACE)) {
      return this.blockStmt();
    }
    if (this.match(TokenType.IF)) {
      return this.ifStmt();
    }
    if (this.match(TokenType.WHILE)) {
      return this.whileStmt();
    }
    if (this.match(TokenType.FOR)) {
      return this.forStmt();
    }

    return this.exprStmt();
  }

  private printStmt(): PrintStmt {
    const value = this.expr();

    this.consume(TokenType.SEMICOLON, 'Expect ";" after value.');

    return new PrintStmt(value);
  }

  private returnStmt(): ReturnStmt {
    const keyword = this.previous();

    let value: Expr | undefined = undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expr();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
    return new ReturnStmt(keyword, value);
  }

  private blockStmt(): BlockStmt {
    let stmts: Stmt[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt) {
        stmts.push(stmt);
      }
    }

    this.consume(TokenType.RIGHT_BRACE, 'Expect "}" after block.');

    return new BlockStmt(stmts);
  }

  private ifStmt(): IfStmt {
    this.consume(TokenType.LEFT_PAREN, 'Expect "(" after "if".');
    const condition = this.expr();
    this.consume(TokenType.RIGHT_PAREN, 'Expect ")" after if condition');

    const thenBranch = this.stmt();
    let elseBranch = undefined;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.stmt();
    }

    return new IfStmt(condition, thenBranch, elseBranch);
  }

  private whileStmt(): WhileStmt {
    this.consume(TokenType.LEFT_PAREN, 'Expect "(" after "while".');
    const condition = this.expr();
    this.consume(TokenType.RIGHT_PAREN, 'Expect ")" after condition.');
    const body = this.stmt();

    return new WhileStmt(condition, body);
  }

  private forStmt(): Stmt {
    this.consume(TokenType.LEFT_PAREN, 'Expect "(" after "for".');

    let initializer;
    if (this.match(TokenType.SEMICOLON)) {
      initializer = undefined;
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.exprStmt();
    }

    let condition = undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expr();
    }
    this.consume(TokenType.SEMICOLON, 'Expect ";" after loop condition.');

    let increment = undefined;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expr();
    }
    this.consume(TokenType.RIGHT_PAREN, 'Expect ")" after for clauses.');

    let body = this.stmt();

    if (increment != null) {
      body = new BlockStmt([body, new ExprStmt(increment)]);
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

  private exprStmt(): ExprStmt {
    const expr = this.expr();

    this.consume(TokenType.SEMICOLON, 'Expect ";" after expression.');

    return new ExprStmt(expr);
  }

  private expr(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.or();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof VariableExpr) {
        return new AssignExpr((expr as VariableExpr).name, value);
      } else if (expr instanceof GetExpr) {
        return new SetExpr(expr.object, expr.name, value);
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
    let expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expr {
    let expr = this.term();

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
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private term(): Expr {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
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
      } else if (this.match(TokenType.DOT)) {
        const name = this.consume(
          TokenType.IDENTIFIER,
          'Expect property name after ".".'
        );
        expr = new GetExpr(expr, name);
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
        args.push(this.expr());
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
      const expr = this.expr();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after expression.');
      return new GroupingExpr(expr);
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
