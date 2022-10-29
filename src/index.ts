import { readFileSync } from 'fs';
import { Interpreter, RuntimeError } from 'interpreter/interpreter';
import { AstPrinter } from 'parser/ast-printer';
import { Parser } from 'parser/parser';
import readline from 'readline';
import { Token, TokenType } from 'scanner/token';

import { Scanner } from './scanner/scanner';

const args = process.argv.slice(2);
console.log(args);

if (args.length > 1) {
  console.log('Usage: lox [script]');
  process.exit(64);
}

const interpreter = new Interpreter();
let hadError = false;
let hadRuntimeError = false;

if (args.length === 1) {
  runFile(args[0]);
} else {
  runPrompt();
}

function runFile(path: string) {
  const content = readFileSync(path).toString();
  run(content);

  if (hadError) {
    process.exit(65);
  }
  if (hadRuntimeError) {
    process.exit(70);
  }
}

function runPrompt() {
  const reader = readline.createInterface(process.stdin, process.stdout);

  reader.setPrompt('> ');
  reader.prompt();

  reader
    .on('line', function (line) {
      if (line == null) {
        process.exit(0);
      }

      run(line);

      hadError = false;
      hadRuntimeError = false;

      reader.prompt();
    })
    .on('close', function () {
      process.exit(0);
    });
}

function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();
  // tokens.forEach((x) => console.log(x));

  const parser = new Parser(tokens);
  const expr = parser.parse();
  if (hadError || expr == null) {
    return;
  }
  // console.log(new AstPrinter().print(expr));

  interpreter.interpret(expr);
}

export function error(line: number, message: string) {
  report(line, '', message);
}

export function reportParserError(token: Token, message: string) {
  if (token.type == TokenType.EOF) {
    report(token.line, ' at end', message);
  } else {
    report(token.line, ` at '${token.lexeme}'`, message);
  }
}

export function reportRuntimeError(error: RuntimeError) {
  console.log(`${error.message} + "\n[line " + ${error.token.line} + "]"`);
  hadRuntimeError = true;
}

export function report(line: number, where: string, message: string) {
  console.error(`[line ${line}] Error ${where}: ${message}`);
  hadError = true;
}
