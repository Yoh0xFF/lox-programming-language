import { RuntimeError } from 'error';
import { Token } from 'scanner/token';

export class Environment {
  private enclosing?: Environment;
  private values = new Map<string, any>();

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }

  define(name: string, value: any) {
    this.values.set(name, value);
  }

  assign(name: Token, value: any) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing != null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable: '${name.lexeme}'.`);
  }

  assignAt(distance: number, name: Token, value: any) {
    this.ancestor(distance).values.set(name.lexeme, value);
  }

  get(name: Token): any {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }

    if (this.enclosing != null) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name, `Undefined variable: ${name.lexeme}.`);
  }

  getAt(distance: number, name: Token): any {
    return this.ancestor(distance).values.get(name.lexeme);
  }

  private ancestor(distance: number): Environment {
    let env: Environment | undefined = this;

    for (let i = 0; i < distance; i++) {
      env = env?.enclosing;
    }

    return env!;
  }
}
