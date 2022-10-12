import { Visitor } from 'parser/visitor';
import { Token } from 'scanner/token';

export interface Expr {
  accept<R>(visitor: Visitor<R>): R;
}

export class BinaryExpr implements Expr {
  leftExpr: Expr;
  operator: Token;
  rightExpr: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    this.leftExpr = left;
    this.operator = operator;
    this.rightExpr = right;
  }

  accept<R>(visitor: Visitor<R>): R {
    throw new Error('Method not implemented.');
  }
}

export class UnaryExpr implements Expr {
  operator: Token;
  rightExpr: Expr;

  constructor(right: Expr, operator: Token) {
    this.rightExpr = right;
    this.operator = operator;
  }

  accept<R>(visitor: Visitor<R>): R {
    throw new Error('Method not implemented.');
  }
}

export class GroupingExpr implements Expr {
  expr: Expr;

  constructor(expr: Expr) {
    this.expr = expr;
  }

  accept<R>(visitor: Visitor<R>): R {
    throw new Error('Method not implemented.');
  }
}

export class LiteralExpr implements Expr {
  value: any;

  constructor(value: any) {
    this.value = value;
  }

  accept<R>(visitor: Visitor<R>): R {
    throw new Error('Method not implemented.');
  }
}
