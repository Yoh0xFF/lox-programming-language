import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from 'parser/expr';
import { ExprVisitor } from 'parser/visitor';

export class AstPrinter implements ExprVisitor<string> {
  print(expr: Expr): string {
    return expr.accept(this);
  }

  private parenthesize(name: string, ...exprs: Expr[]): string {
    let result = `(${name}`;

    exprs.forEach((x) => {
      result = `${result} ${x.accept(this)}`;
    });

    result = `${result})`;
    return result;
  }

  visitBinaryExpr(expr: BinaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitUnaryExpr(expr: UnaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  visitGroupingExpr(expr: GroupingExpr): string {
    return this.parenthesize('group', expr.expr);
  }

  visitLiteralExpr(expr: LiteralExpr): string {
    if (expr.value == null) {
      return 'nil';
    }
    return expr.value.toString();
  }
}
