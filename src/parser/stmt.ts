import { Expr, VariableExpr } from 'parser/expr';
import { StmtVisitor } from 'parser/visitor';
import { Token } from 'scanner/token';

export interface Stmt {
  accept<R>(visitor: StmtVisitor<R>): R;
}

export class BlockStmt implements Stmt {
  constructor(public stmts: Stmt[]) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}

export class ExprStmt implements Stmt {
  constructor(public expr: Expr) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExprStmt(this);
  }
}

export class ClassStmt implements Stmt {
  constructor(
    public name: Token,
    public superclass: VariableExpr | undefined,
    public methods: FunctionStmt[]
  ) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitClassStmt(this);
  }
}

export class FunctionStmt implements Stmt {
  constructor(
    public name: Token,
    public params: Token[],
    public body: Stmt[]
  ) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitFunctionStmt(this);
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
  constructor(public expr: Expr) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}

export class ReturnStmt implements Stmt {
  constructor(public keyword: Token, public value?: Expr) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitReturnStmt(this);
  }
}

export class WhileStmt implements Stmt {
  constructor(public condition: Expr, public body: Stmt) {}

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitWhileStmt(this);
  }
}
