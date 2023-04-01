import { RuntimeError } from 'error';
import { LoxCallable } from 'interpreter/callable';
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
  ExpressionStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  Stmt,
  VarStmt,
  WhileStmt,
} from 'parser/stmt';
import { ExprVisitor, StmtVisitor } from 'parser/visitor';
import { Token, TokenType } from 'scanner/token';

export class Interpreter implements StmtVisitor<void>, ExprVisitor<any> {
  private globals = new Environment();
  private environment = this.globals;

  constructor() {
    const clock: LoxCallable = {
      arity: () => 0,

      call: (interpreter, args) => {
        return new Date().getTime() / 1000.0;
      },
    };

    this.globals.define('clock', clock);
  }

  interpret(statements: Stmt[]): boolean {
    try {
      for (const statement of statements) {
        this.execute(statement);
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

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expression);
  }

  visitFunctionStmt(statement: FunctionStmt): void {
    // TODO
  }

  visitVarStmt(stmt: VarStmt): void {
    let value = undefined;

    if (stmt.initializer != null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expression);
    console.log(JSON.stringify(value));
  }

  visitBlockStmt(statement: BlockStmt): void {
    this.executeBlock(statement.statements, new Environment(this.environment));
  }

  visitIfStmt(statement: IfStmt): void {
    if (this.isTruthy(this.evaluate(statement.condition))) {
      this.execute(statement.thenBranch);
    } else if (statement.elseBranch != null) {
      this.execute(statement.elseBranch);
    }
  }

  visitWhileStmt(statement: WhileStmt): void {
    const { condition, body } = statement;

    while (this.isTruthy(this.evaluate(condition))) {
      this.execute(body);
    }
  }

  visitAssignExpr(expression: AssignExpr): any {
    const value = this.evaluate(expression.value);
    this.environment.assign(expression.name, value);
    return value;
  }

  visitBinaryExpr(expression: BinaryExpr): any {
    const left = this.evaluate(expression.left);
    const right = this.evaluate(expression.right);

    switch (expression.operator.type) {
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
      case TokenType.GREATER:
        this.checkNumberOperands(expression.operator, left, right);
        return Number(left) > Number(right);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expression.operator, left, right);
        return Number(left) >= Number(right);
      case TokenType.LESS:
        this.checkNumberOperands(expression.operator, left, right);
        return Number(left) < Number(right);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expression.operator, left, right);
        return Number(left) <= Number(right);
      case TokenType.MINUS:
        this.checkNumberOperands(expression.operator, left, right);
        return Number(left) - Number(right);
      case TokenType.PLUS:
        if (this.isNumber(left) && this.isNumber(right)) {
          return Number(left) + Number(right);
        }
        if (this.isString(left) && this.isString(right)) {
          return String(left) + String(right);
        }
        throw new RuntimeError(
          expression.operator,
          'Operands must be two numbers or two strings.'
        );
      case TokenType.SLASH:
        this.checkNumberOperands(expression.operator, left, right);
        return Number(left) / Number(right);
      case TokenType.STAR:
        this.checkNumberOperands(expression.operator, left, right);
        return Number(left) * Number(right);
    }

    return null;
  }

  visitCallExpr(expression: CallExpr) {
    const callee = this.evaluate(expression.callee);

    const args = [];
    for (const arg of expression.args) {
      args.push(this.evaluate(arg));
    }

    const func = callee as LoxCallable;
    if (func.call === undefined) {
      throw new RuntimeError(
        expression.paren,
        'Can only call functions and classes.'
      );
    }
    if (func.arity() !== args.length) {
      throw new RuntimeError(
        expression.paren,
        `Expected ${func.arity()} arguments but got ${args.length}.`
      );
    }

    return func.call(this, args);
  }

  visitUnaryExpr(expression: UnaryExpr): any {
    const right = this.evaluate(expression.right);

    switch (expression.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperands(expression.operator, right);
        return -1 * Number(right);
    }

    return null;
  }

  visitGroupingExpr(expression: GroupingExpr): any {
    return this.evaluate(expression.expression);
  }

  visitLiteralExpr(expression: LiteralExpr): any {
    return expression.value;
  }

  visitVariableExpr(expression: VariableExpr): any {
    return this.environment.get(expression.name);
  }

  visitLogicalExpr(expression: LogicalExpr): any {
    const left = this.evaluate(expression.left);

    if (expression.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) {
        return left;
      }
    } else {
      if (!this.isTruthy(left)) {
        return left;
      }
    }

    return this.evaluate(expression.right);
  }

  private execute(statement: Stmt): void {
    statement.accept(this);
  }

  private executeBlock(statements: Stmt[], environment: Environment): void {
    const previous = this.environment;
    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  private evaluate(statement: Expr): any {
    return statement.accept(this);
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
