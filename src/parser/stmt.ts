import { Expr } from 'parser/expr';
import { StmtVisitor } from 'parser/visitor';
import { Token } from 'scanner/token';

export interface Stmt {
  accept<R>(visitor: StmtVisitor<R>): R;
}

export class ExpressionStmt implements Stmt {
  constructor(public expression: Expr) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class VarStmt implements Stmt {
  constructor(public name: Token, public initializer: Expr | null) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}

export class PrintStmt implements Stmt {
  constructor(public expression: Expr) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}
