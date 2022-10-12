import { BinaryExpr, GroupingExpr, LiteralExpr, UnaryExpr } from 'parser/expr';

export interface Visitor<R> {
  visitBinaryExpr(expr: BinaryExpr): R;
  visitUnaryExpr(expr: UnaryExpr): R;
  visitGroupingExpr(expr: GroupingExpr): R;
  visitLiteralExpr(expr: LiteralExpr): R;
}
