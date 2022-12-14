import {
  AssignExpr,
  BinaryExpr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  VariableExpr,
} from 'parser/expr';
import {
  BlockStmt,
  ExpressionStmt,
  IfStmt,
  PrintStmt,
  VarStmt,
} from 'parser/stmt';

export interface StmtVisitor<R> {
  visitBlockStmt(statement: BlockStmt): R;
  visitExpressionStmt(statement: ExpressionStmt): R;
  visitVarStmt(statement: VarStmt): R;
  visitPrintStmt(statement: PrintStmt): R;
  visitIfStmt(statement: IfStmt): R;
}

export interface ExprVisitor<R> {
  visitAssignExpr(expression: AssignExpr): R;
  visitBinaryExpr(expression: BinaryExpr): R;
  visitUnaryExpr(expression: UnaryExpr): R;
  visitGroupingExpr(expression: GroupingExpr): R;
  visitLiteralExpr(expression: LiteralExpr): R;
  visitVariableExpr(expression: VariableExpr): R;
}
