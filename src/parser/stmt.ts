import { Expr } from 'parser/expr';
import { StmtVisitor } from 'parser/visitor';
import { Token } from 'scanner/token';

export interface Stmt {
  accept<R>(visitor: StmtVisitor<R>): R;
}

export class BlockStmt implements Stmt {
  constructor(public statements: Stmt[]) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}

export class ExpressionStmt implements Stmt {
  constructor(public expression: Expr) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class VarStmt implements Stmt {
  constructor(public name: Token, public initializer?: Expr) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}

export class IfStmt implements Stmt {
  constructor(
    public condition: Expr,
    public thenBranch: Stmt,
    public elseBranch?: Stmt
  ) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitIfStmt(this);
  }
}

export class PrintStmt implements Stmt {
  constructor(public expression: Expr) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}
