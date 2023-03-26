import { Interpreter } from 'interpreter/interpreter';

export interface LoxCallable {
  call(interpreter: Interpreter, args: any[]): any;
  arity(): number;
}
