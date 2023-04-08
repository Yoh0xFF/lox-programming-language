import { RuntimeError } from 'error';
import { LoxCallable, LoxFunction, Return } from 'interpreter/callable';
import { Environment } from 'interpreter/environment';
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
  ExprStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  Stmt,
  VarStmt,
  WhileStmt,
} from 'parser/stmt';
import { ExprVisitor, StmtVisitor } from 'parser/visitor';
import { Token, TokenType } from 'scanner/token';

export class Interpreter implements StmtVisitor<void>, ExprVisitor<any> {
  public globals = new Environment();
  private locals: Map<Expr, number> = new Map();
  private env = this.globals;

  constructor() {
    const clock: LoxCallable = {
      arity: () => 0,

      call: (interpreter, args) => {
        return new Date().getTime() / 1000.0;
      },
    };

    this.globals.define('clock', clock);
  }

  resolve(expr: Expr, depth: number) {
    this.locals.set(expr, depth);
  }

  interpret(stmts: Stmt[]): boolean {
    try {
      for (const stmt of stmts) {
        this.execute(stmt);
      }

      return true;
    } catch (error) {
      if (error instanceof RuntimeError) {
        this.reportRuntimeError(error);
      } else {
        console.error(error);
      }
      return false;
    }
  }

  visitExprStmt(stmt: ExprStmt): void {
    this.evaluate(stmt.expr);
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    const loxFunction = new LoxFunction(stmt, this.env);
    this.env.define(stmt.name.lexeme, loxFunction);
  }

  visitVarStmt(stmt: VarStmt): void {
    let value = undefined;

    if (stmt.initializer != null) {
      value = this.evaluate(stmt.initializer);
    }

    this.env.define(stmt.name.lexeme, value);
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expr);
    console.log(JSON.stringify(value));
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    let value = undefined;

    if (stmt.value) {
      value = this.evaluate(stmt.value);
    }

    throw new Return(value);
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.executeBlock(stmt.stmts, new Environment(this.env));
  }

  visitIfStmt(stmt: IfStmt): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch != null) {
      this.execute(stmt.elseBranch);
    }
  }

  visitWhileStmt(stmt: WhileStmt): void {
    const { condition, body } = stmt;

    while (this.isTruthy(this.evaluate(condition))) {
      this.execute(body);
    }
  }

  visitAssignExpr(expr: AssignExpr): any {
    const value = this.evaluate(expr.value);

    const distance = this.locals.get(expr);
    if (distance != null) {
      this.env.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }
    this.env.assign(expr.name, value);

    return value;
  }

  visitBinaryExpr(expr: BinaryExpr): any {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) > Number(right);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) >= Number(right);
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) < Number(right);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) <= Number(right);
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) - Number(right);
      case TokenType.PLUS:
        if (this.isNumber(left) && this.isNumber(right)) {
          return Number(left) + Number(right);
        }
        if (this.isString(left) && this.isString(right)) {
          return String(left) + String(right);
        }
        throw new RuntimeError(
          expr.operator,
          'Operands must be two numbers or two strings.'
        );
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) / Number(right);
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) * Number(right);
    }

    return null;
  }

  visitCallExpr(expr: CallExpr) {
    const callee = this.evaluate(expr.callee);

    const args = [];
    for (const arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    const func = callee as LoxCallable;
    if (func.call === undefined) {
      throw new RuntimeError(
        expr.paren,
        'Can only call functions and classes.'
      );
    }
    if (func.arity() !== args.length) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${func.arity()} arguments but got ${args.length}.`
      );
    }

    return func.call(this, args);
  }

  visitUnaryExpr(expr: UnaryExpr): any {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, right);
        return -1 * Number(right);
    }

    return null;
  }

  visitGroupingExpr(expr: GroupingExpr): any {
    return this.evaluate(expr.expr);
  }

  visitLiteralExpr(expr: LiteralExpr): any {
    return expr.value;
  }

  visitVariableExpr(expr: VariableExpr): any {
    return this.lookupVarable(expr.name, expr);
  }

  private lookupVarable(name: Token, expr: Expr) {
    const distance = this.locals.get(expr);
    if (distance != null) {
      return this.env.getAt(distance, name);
    } else {
      return this.globals.get(name);
    }
  }

  visitLogicalExpr(expr: LogicalExpr): any {
    const left = this.evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) {
        return left;
      }
    } else {
      if (!this.isTruthy(left)) {
        return left;
      }
    }

    return this.evaluate(expr.right);
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  executeBlock(stmts: Stmt[], env: Environment): void {
    const previous = this.env;
    try {
      this.env = env;

      for (const stmt of stmts) {
        this.execute(stmt);
      }
    } finally {
      this.env = previous;
    }
  }

  private evaluate(stmt: Expr): any {
    return stmt.accept(this);
  }

  private isTruthy(right: any): boolean {
    if (right == null) {
      return false;
    }
    if (typeof right === 'boolean' || right instanceof Boolean) {
      return Boolean(right);
    }
    return true;
  }

  private isEqual(left: any, right: any): boolean {
    if (left == null && right == null) {
      return true;
    }
    if (left == null) {
      return false;
    }
    return left === right;
  }

  private checkNumberOperands(operator: Token, ...operands: any[]) {
    let result = true;

    for (const operand of operands) {
      result = result && this.isNumber(operand);
    }

    if (result) {
      return;
    }

    throw new RuntimeError(operator, 'Operands must be numbers');
  }

  private isNumber(value: any): boolean {
    return typeof value === 'number' || value instanceof Number;
  }

  private isString(value: any): boolean {
    return typeof value === 'string' || value instanceof String;
  }

  private reportRuntimeError(error: RuntimeError) {
    console.log(`${error.message} -> [line ${error.token.line}]`);
  }
}
