import {
  BinaryExpr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  VariableExpr,
} from 'parser/expr';
import { ExpressionStmt, PrintStmt, VarStmt } from 'parser/stmt';

export interface StmtVisitor<R> {
  visitExpressionStmt(statement: ExpressionStmt): R;
  visitVarStmt(statement: VarStmt): R;
  visitPrintStmt(statement: PrintStmt): R;
}

export interface ExprVisitor<R> {
  visitBinaryExpr(expression: BinaryExpr): R;
  visitUnaryExpr(expression: UnaryExpr): R;
  visitGroupingExpr(expression: GroupingExpr): R;
  visitLiteralExpr(expression: LiteralExpr): R;
  visitVariableExpr(expression: VariableExpr): R;
}
