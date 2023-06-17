import { ExprVisitor } from 'parser/visitor';
import { Token } from 'scanner/token';

export interface Expr {
  accept<R>(visitor: ExprVisitor<R>): R;
}

export class AssignExpr implements Expr {
  constructor(public name: Token, public value: Expr) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitAssignExpr(this);
  }
}

export class BinaryExpr implements Expr {
  constructor(public left: Expr, public operator: Token, public right: Expr) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
}

export class UnaryExpr implements Expr {
  constructor(public operator: Token, public right: Expr) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}

export class GroupingExpr implements Expr {
  constructor(public expr: Expr) {
    this.expr = expr;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

export class LiteralExpr implements Expr {
  constructor(public value: any) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

export class VariableExpr implements Expr {
  constructor(public name: Token) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitVariableExpr(this);
  }
}

export class LogicalExpr implements Expr {
  constructor(public left: Expr, public operator: Token, public right: Expr) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLogicalExpr(this);
  }
}

export class CallExpr implements Expr {
  constructor(public callee: Expr, public paren: Token, public args: Expr[]) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitCallExpr(this);
  }
}

export class GetExpr implements Expr {
  constructor(public object: Expr, public name: Token) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGetExpr(this);
  }
}

export class SetExpr implements Expr {
  constructor(public object: Expr, public name: Token, public value: Expr) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitSetExpr(this);
  }
}

export class ThisExpr implements Expr {
  constructor(public keyword: Token) {}

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitThisExpr(this);
  }
}
