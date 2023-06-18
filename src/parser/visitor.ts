import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  GetExpr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  SetExpr,
  SuperExpr,
  ThisExpr,
  UnaryExpr,
  VariableExpr,
} from 'parser/expr';
import {
  BlockStmt,
  ClassStmt,
  ExprStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  VarStmt,
  WhileStmt,
} from 'parser/stmt';

export interface StmtVisitor<R> {
  visitBlockStmt(stmt: BlockStmt): R;

  visitExprStmt(stmt: ExprStmt): R;

  visitClassStmt(stmt: ClassStmt): R;

  visitFunctionStmt(stmt: FunctionStmt): R;

  visitVarStmt(stmt: VarStmt): R;

  visitPrintStmt(stmt: PrintStmt): R;

  visitReturnStmt(stmt: ReturnStmt): R;

  visitIfStmt(stmt: IfStmt): R;

  visitWhileStmt(stmt: WhileStmt): R;
}

export interface ExprVisitor<R> {
  visitAssignExpr(expr: AssignExpr): R;

  visitBinaryExpr(expr: BinaryExpr): R;

  visitUnaryExpr(expr: UnaryExpr): R;

  visitGroupingExpr(expr: GroupingExpr): R;

  visitLiteralExpr(expr: LiteralExpr): R;

  visitVariableExpr(expr: VariableExpr): R;

  visitLogicalExpr(expr: LogicalExpr): R;

  visitCallExpr(expr: CallExpr): R;

  visitGetExpr(expr: GetExpr): R;

  visitSetExpr(expr: SetExpr): R;

  visitThisExpr(expr: ThisExpr): R;

  visitSuperExpr(expr: SuperExpr): R;
}
