import { Interpreter } from 'interpreter/interpreter';
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
  SuperExpr,
  ThisExpr,
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
import { ExprVisitor, StmtVisitor } from 'parser/visitor';
import { Token } from 'scanner/token';

enum FunctionType {
  None = 'NONE',
  Function = 'FUNCTION',
  Initializer = 'INITIALIZER',
  Method = 'METHOD',
}

enum ClassType {
  None = 'NONE',
  Class = 'CLASS',
  Subclass = 'SUBCLASS',
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private scopes: Map<string, boolean>[] = [];
  private currentFunctionType = FunctionType.None;
  private currentClassType = ClassType.None;
  public hadError = false;

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

    if (scope && scope.get(expr.name.lexeme) === false) {
      this.reportResolverError(
        expr.name,
        "Can't read local variable in its own initializer."
      );
    }

    this.resolveLocal(expr, expr.name);
  }

  visitAssignExpr(expr: AssignExpr) {
    this.resolveExpr(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  private resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }

  visitClassStmt(stmt: ClassStmt): void {
    const enclosingClassType = this.currentClassType;
    this.currentClassType = ClassType.Class;
    this.declare(stmt.name);
    this.define(stmt.name);

    if (
      stmt.superclass != null &&
      stmt.name.lexeme === stmt.superclass.name.lexeme
    ) {
      this.reportResolverError(
        stmt.superclass.name,
        "A class can't inherit from itself."
      );
    }
    if (stmt.superclass) {
      this.currentClassType = ClassType.Subclass;
      this.resolveExpr(stmt.superclass);
      this.beginScope();
      this.scopes[this.scopes.length - 1].set('super', true);
    }

    this.beginScope();
    this.scopes[this.scopes.length - 1].set('this', true);

    for (const method of stmt.methods) {
      let declaration = FunctionType.Method;

      if (method.name.lexeme === 'init') {
        declaration = FunctionType.Initializer;
      }

      this.resolveFunction(method, declaration);
    }

    this.endScope();

    if (stmt.superclass) {
      this.endScope();
    }

    this.currentClassType = enclosingClassType;
  }

  visitFunctionStmt(stmt: FunctionStmt) {
    this.declare(stmt.name);
    this.define(stmt.name);

    this.resolveFunction(stmt, FunctionType.Function);
  }

  private resolveFunction(stmt: FunctionStmt, type: FunctionType) {
    const enclosingFunctionType = this.currentFunctionType;
    this.currentFunctionType = type;
    this.beginScope();

    for (const param of stmt.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolveStmts(stmt.body);

    this.endScope();
    this.currentFunctionType = enclosingFunctionType;
  }

  visitExprStmt(stmt: ExprStmt) {
    this.resolveExpr(stmt.expr);
  }

  visitIfStmt(stmt: IfStmt) {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.thenBranch);
    if (stmt.elseBranch) {
      this.resolveStmt(stmt.elseBranch);
    }
  }

  visitPrintStmt(stmt: PrintStmt) {
    this.resolveExpr(stmt.expr);
  }

  visitReturnStmt(stmt: ReturnStmt) {
    if (this.currentFunctionType === FunctionType.None) {
      this.reportResolverError(
        stmt.keyword,
        "Can't return from top-level code."
      );
    }

    if (stmt.value) {
      if (this.currentFunctionType == FunctionType.Initializer) {
        this.reportResolverError(
          stmt.keyword,
          "Can't return a value from an initializer."
        );
      }

      this.resolveExpr(stmt.value);
    }
  }

  visitWhileStmt(stmt: WhileStmt) {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.body);
  }

  visitBinaryExpr(expr: BinaryExpr) {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
  }

  visitCallExpr(expr: CallExpr) {
    this.resolveExpr(expr.callee);

    for (const arg of expr.args) {
      this.resolveExpr(arg);
    }
  }

  visitGetExpr(expr: GetExpr): void {
    this.resolveExpr(expr.object);
  }

  visitSetExpr(expr: SetExpr): void {
    this.resolveExpr(expr.value);
    this.resolveExpr(expr.object);
  }

  visitThisExpr(expr: ThisExpr): void {
    if (this.currentClassType == ClassType.None) {
      this.reportResolverError(
        expr.keyword,
        "Can't use 'this' outside of a class."
      );
      return;
    }

    this.resolveLocal(expr, expr.keyword);
  }

  visitSuperExpr(expr: SuperExpr): void {
    if (this.currentClassType === ClassType.None) {
      this.reportResolverError(
        expr.keyword,
        "Can't use 'super' outside of a class."
      );
    } else if (this.currentClassType !== ClassType.Subclass) {
      this.reportResolverError(
        expr.keyword,
        "Can't use 'super' in a class with no superclass."
      );
    }

    this.resolveLocal(expr, expr.keyword);
  }

  visitGroupingExpr(expr: GroupingExpr) {
    this.resolveExpr(expr.expr);
  }

  visitLiteralExpr(expr: LiteralExpr) {}

  visitLogicalExpr(expr: LogicalExpr) {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
  }

  visitUnaryExpr(expr: UnaryExpr) {
    this.resolveExpr(expr.right);
  }

  private beginScope() {
    this.scopes.push(new Map());
  }

  private endScope() {
    this.scopes.pop();
  }

  resolveStmts(stmts: Stmt[]) {
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

    if (scope.has(name.lexeme)) {
      this.reportResolverError(
        name,
        'Already a variable with this name in this scope.'
      );
    }

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
    this.hadError = true;
  }
}
