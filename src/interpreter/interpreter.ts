import { reportRuntimeError } from 'index';
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from 'parser/expr';
import { ExpressionStmt, PrintStmt, Stmt, VarStmt } from 'parser/stmt';
import { ExprVisitor, StmtVisitor } from 'parser/visitor';
import { Token, TokenType } from 'scanner/token';

export class Interpreter implements StmtVisitor<void>, ExprVisitor<any> {
  interpret(statements: Stmt[]) {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
      // const value = this.evaluate(expr);
      // console.log(JSON.stringify(value));
    } catch (error) {
      if (error instanceof RuntimeError) {
        reportRuntimeError(error);
      } else {
        console.error(error);
      }
    }
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expression);
  }

  visitVarStmt(stmt: VarStmt): void {
    throw new Error('Method not implemented.');
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expression);
    console.log(JSON.stringify(value));
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

  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  private evaluate(expr: Expr): any {
    return expr.accept(this);
  }

  private isTruthy(right: any): boolean {
    if (right == null) {
      return false;
    }
    if (right instanceof Boolean) {
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
}

export class RuntimeError {
  constructor(public token: Token, public message: String) {}
}
