import { Token } from 'scanner/token';

export class ParseError {}

export class RuntimeError {
  constructor(public token: Token, public message: String) {}
}
