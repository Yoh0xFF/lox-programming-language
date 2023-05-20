import { LoxCallable } from 'interpreter/callable';
import { Interpreter } from 'interpreter/interpreter';

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

class LoxInstance {
  constructor(public clazz: LoxClass) {}

  toString() {
    return `<class instance ${this.clazz.name}>`;
  }
}
