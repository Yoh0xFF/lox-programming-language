import { BinaryExpr, GroupingExpr, LiteralExpr, UnaryExpr } from 'parser/expr';
import { ExpressionStmt, PrintStmt, VarStmt } from 'parser/stmt';

export interface StmtVisitor<R> {
  visitExpressionStmt(stmt: ExpressionStmt): R;
  visitVarStmt(stmt: VarStmt): R;
  visitPrintStmt(stmt: PrintStmt): R;
}

export interface ExprVisitor<R> {
  visitBinaryExpr(expr: BinaryExpr): R;
  visitUnaryExpr(expr: UnaryExpr): R;
  visitGroupingExpr(expr: GroupingExpr): R;
  visitLiteralExpr(expr: LiteralExpr): R;
}
