import { RuntimeError } from 'error';
import { LoxCallable, LoxFunction } from 'interpreter/callable';
import { Interpreter } from 'interpreter/interpreter';
import { Token } from 'scanner/token';

export class LoxClass implements LoxCallable {
  constructor(public name: string, public methods: Map<string, LoxFunction>) {}

  call(interpreter: Interpreter, args: any[]) {
    const instance = new LoxInstance(this);

    const initializer = this.findMethod('init');
    if (initializer) {
      initializer.bind(instance).call(interpreter, args);
    }

    return instance;
  }

  arity(): number {
    const initializer = this.findMethod('init');
    if (initializer) {
      return initializer.arity();
    }
    return 0;
  }

  toString() {
    return `<class ${this.name}>`;
  }

  findMethod(name: string): LoxFunction | undefined {
    if (this.methods.has(name)) {
      return this.methods.get(name);
    }

    return undefined;
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

    if (this.clazz.methods.has(name.lexeme)) {
      return this.clazz.methods.get(name.lexeme)?.bind(this);
    }

    throw new RuntimeError(name, `Undefined property "${name.lexeme}".`);
  }

  set(name: Token, value: any) {
    this.fields.set(name.lexeme, value);
  }
}
