import { Visitor } from 'parser/visitor';
import { Token } from 'scanner/token';

export interface Expr {
  accept<R>(visitor: Visitor<R>): R;
}

export class BinaryExpr implements Expr {
  constructor(public left: Expr, public operator: Token, public right: Expr) {}

  accept<R>(visitor: Visitor<R>): R {
    throw new Error('Method not implemented.');
  }
}

export class UnaryExpr implements Expr {
  constructor(public right: Expr, public operator: Token) {}

  accept<R>(visitor: Visitor<R>): R {
    throw new Error('Method not implemented.');
  }
}

export class GroupingExpr implements Expr {
  constructor(public expr: Expr) {
    this.expr = expr;
  }

  accept<R>(visitor: Visitor<R>): R {
    throw new Error('Method not implemented.');
  }
}

export class LiteralExpr implements Expr {
  constructor(public value: any) {
    this.value = value;
  }

  accept<R>(visitor: Visitor<R>): R {
    throw new Error('Method not implemented.');
  }
}
