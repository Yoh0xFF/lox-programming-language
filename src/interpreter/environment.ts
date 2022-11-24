import { RuntimeError } from 'error';
import { Token } from 'scanner/token';

export class Environment {
  private values = new Map<string, any>();

  define(name: string, value: any) {
    this.values.set(name, value);
  }

  get(name: Token): any {
    const value = this.values.get(name.lexeme);

    if (value == null) {
      throw new RuntimeError(name, `Undefined variable: ${name.lexeme}.`);
    }

    return value;
  }
}
