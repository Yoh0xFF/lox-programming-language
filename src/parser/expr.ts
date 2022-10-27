import { Visitor } from 'parser/visitor';
import { Token } from 'scanner/token';

export interface Expr {
  accept<R>(visitor: Visitor<R>): R;
}

export class BinaryExpr implements Expr {
  constructor(public left: Expr, public operator: Token, public right: Expr) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
}

export class UnaryExpr implements Expr {
  constructor(public operator: Token, public right: Expr) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}

export class GroupingExpr implements Expr {
  constructor(public expr: Expr) {
    this.expr = expr;
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

export class LiteralExpr implements Expr {
  constructor(public value: any) {
    this.value = value;
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}
