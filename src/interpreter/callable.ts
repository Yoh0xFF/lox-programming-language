import { Environment } from 'interpreter/environment';
import { Interpreter } from 'interpreter/interpreter';
import { FunctionStmt } from 'parser/stmt';

import { LoxInstance } from './class';

export interface LoxCallable {
  call(interpreter: Interpreter, args: any[]): any;

  arity(): number;
}

export class LoxFunction implements LoxCallable {
  constructor(
    private declaration: FunctionStmt,
    private closure: Environment,
    private isInitializer: boolean = false
  ) {}

  call(interpreter: Interpreter, args: any[]) {
    const env = new Environment(this.closure);

    for (let i = 0; i < this.declaration.params.length; i++) {
      env.define(this.declaration.params[i].lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration.body, env);
    } catch (result) {
      if (result instanceof Return) {
        if (this.isInitializer) {
          return this.closure.getAtByLexeme(0, 'this');
        }

        return result.value;
      }
      console.error(result);
      throw result;
    }

    if (this.isInitializer) {
      return this.closure.getAtByLexeme(0, 'this');
    }
  }

  bind(instance: LoxInstance): LoxFunction {
    const env = new Environment(this.closure);
    env.define('this', instance);
    return new LoxFunction(this.declaration, env, this.isInitializer);
  }

  arity(): number {
    return this.declaration.params.length;
  }

  toString() {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}

export class Return {
  constructor(public value?: any) {}
}
