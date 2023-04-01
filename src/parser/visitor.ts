import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  UnaryExpr,
  VariableExpr,
} from 'parser/expr';
import {
  BlockStmt,
  ExpressionStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  VarStmt,
  WhileStmt,
} from 'parser/stmt';

export interface StmtVisitor<R> {
  visitBlockStmt(statement: BlockStmt): R;
  visitExpressionStmt(statement: ExpressionStmt): R;
  visitFunctionStmt(statement: FunctionStmt): R;
  visitVarStmt(statement: VarStmt): R;
  visitPrintStmt(statement: PrintStmt): R;
  visitIfStmt(statement: IfStmt): R;
  visitWhileStmt(statement: WhileStmt): R;
}

export interface ExprVisitor<R> {
  visitAssignExpr(expression: AssignExpr): R;
  visitBinaryExpr(expression: BinaryExpr): R;
  visitUnaryExpr(expression: UnaryExpr): R;
  visitGroupingExpr(expression: GroupingExpr): R;
  visitLiteralExpr(expression: LiteralExpr): R;
  visitVariableExpr(expression: VariableExpr): R;
  visitLogicalExpr(expression: LogicalExpr): R;
  visitCallExpr(expression: CallExpr): R;
}
