import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from 'parser/expr';
import { Visitor } from 'parser/visitor';

export class AstPrinter implements Visitor<string> {
  private parenthesize(name: string, ...exprs: Expr[]): string {
    let result = `(${name}`;

    exprs.forEach((x) => {
      result = `${result} ${x.accept(this)}`;
    });

    result = `${result})`;
    return result;
  }

  visitBinaryExpr(expr: BinaryExpr): string {
    return this.parenthesize(
      expr.operator.lexeme,
      expr.leftExpr,
      expr.rightExpr
    );
  }

  visitUnaryExpr(expr: UnaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.rightExpr);
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
