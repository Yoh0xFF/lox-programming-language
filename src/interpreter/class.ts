import { RuntimeError } from 'error';
import { LoxCallable } from 'interpreter/callable';
import { Interpreter } from 'interpreter/interpreter';
import { Token } from 'scanner/token';

export class LoxClass implements LoxCallable {
  constructor(public name: string) {}

  call(interpreter: Interpreter, args: any[]) {
    return new LoxInstance(this);
  }

  arity(): number {
    return 0;
  }

  toString() {
    return `<class ${this.name}>`;
  }
}

export class LoxInstance {
  private fields = new Map<string, any>();

  constructor(public clazz: LoxClass) {}

  toString() {
    return `<class instance ${this.clazz.name}>`;
  }

  get(name: Token): any {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme);
    }

    throw new RuntimeError(name, `Undefined property "${name.lexeme}".`);
  }
}
