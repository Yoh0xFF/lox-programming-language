import { Environment } from 'interpreter/environment';
import { Interpreter } from 'interpreter/interpreter';
import { FunctionStmt } from 'parser/stmt';

export interface LoxCallable {
  call(interpreter: Interpreter, args: any[]): any;
  arity(): number;
}

export class LoxFunction implements LoxCallable {
  constructor(private declaration: FunctionStmt) {}

  call(interpreter: Interpreter, args: any[]) {
    const env = new Environment(interpreter.globals);

    for (let i = 0; i < this.declaration.params.length; i++) {
      env.define(this.declaration.params[i].lexeme, args[i]);
    }

    interpreter.executeBlock(this.declaration.body, env);
  }

  arity(): number {
    return this.declaration.params.length;
  }

  toString() {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
