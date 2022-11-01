import { ExprVisitor } from 'parser/visitor';
import { Token } from 'scanner/token';

export interface Expr {
  accept<R>(visitor: ExprVisitor<R>): R;
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
  constructor(public expression: Expr) {
    this.expression = expression;
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
