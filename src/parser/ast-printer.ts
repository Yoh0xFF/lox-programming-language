import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  VariableExpr,
} from 'parser/expr';
import { ExprVisitor } from 'parser/visitor';

export class AstPrinter implements ExprVisitor<string> {
  print(expression: Expr): string {
    return expression.accept(this);
  }

  private parenthesize(name: string, ...expressions: Expr[]): string {
    let result = `(${name}`;

    expressions.forEach((x) => {
      result = `${result} ${x.accept(this)}`;
    });

    result = `${result})`;
    return result;
  }

  visitBinaryExpr(expression: BinaryExpr): string {
    return this.parenthesize(
      expression.operator.lexeme,
      expression.left,
      expression.right
    );
  }

  visitUnaryExpr(expression: UnaryExpr): string {
    return this.parenthesize(expression.operator.lexeme, expression.right);
  }

  visitGroupingExpr(expression: GroupingExpr): string {
    return this.parenthesize('group', expression.expression);
  }

  visitLiteralExpr(expression: LiteralExpr): string {
    if (expression.value == null) {
      return 'nil';
    }
    return expression.value.toString();
  }

  visitVariableExpr(expression: VariableExpr): string {
    return expression.name.lexeme;
  }
}
