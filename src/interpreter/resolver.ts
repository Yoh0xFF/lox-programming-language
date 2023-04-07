import { Interpreter } from 'interpreter/interpreter';
import { AssignExpr, Expr, VariableExpr } from 'parser/expr';
import { BlockStmt, Stmt, VarStmt } from 'parser/stmt';
import { ExprVisitor, StmtVisitor } from 'parser/visitor';
import { Token, TokenType } from 'scanner/token';

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private scopes: Map<string, boolean>[] = [];

  constructor(private interpreter: Interpreter) {}

  visitBlockStmt(stmt: BlockStmt): void {
    this.beginScope();
    this.resolveStmts(stmt.stmts);
    this.endScope();
  }

  visitVarStmt(stmt: VarStmt) {
    this.declare(stmt.name);
    if (stmt.initializer) {
      this.resolveExpr(stmt.initializer);
    }
    this.define(stmt.name);
  }

  visitVariableExpr(expr: VariableExpr): void {
    const scope =
      this.scopes.length === 0
        ? undefined
        : this.scopes[this.scopes.length - 1];

    if (!scope || scope.get(expr.name.lexeme) === false) {
      this.reportResolverError(
        expr.name,
        "Can't read local variable in its own initializer."
      );
    }

    this.resolveLocal(expr, expr.name);
  }

  visitAssignExpr(expr: AssignExpr): void {
    this.resolveExpr(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  private resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.lexeme)) {
        // TODO this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }

  private beginScope() {
    this.scopes.push(new Map());
  }

  private endScope() {
    this.scopes.pop();
  }

  private resolveStmts(stmts: Stmt[]) {
    for (const stmt of stmts) {
      this.resolveStmt(stmt);
    }
  }

  private resolveStmt(stmt: Stmt) {
    stmt.accept(this);
  }

  private resolveExpr(expr: Expr) {
    expr.accept(this);
  }

  private declare(name: Token) {
    if (this.scopes.length === 0) {
      return;
    }
    const scope = this.scopes[this.scopes.length - 1];
    scope.set(name.lexeme, false);
  }

  private define(name: Token) {
    if (this.scopes.length === 0) {
      return;
    }
    const scope = this.scopes[this.scopes.length - 1];
    scope.set(name.lexeme, true);
  }

  private reportResolverError(token: Token, message: string) {
    this.reportResolverErrorFormatted(
      token.line,
      ` at '${token.lexeme}'`,
      message
    );
  }

  private reportResolverErrorFormatted(
    line: number,
    where: string,
    message: string
  ) {
    console.error(`[line ${line}] Error ${where}: ${message}`);
  }
}
