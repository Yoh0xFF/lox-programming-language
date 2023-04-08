import { readFileSync } from 'fs';
import { Interpreter } from 'interpreter/interpreter';
import { Resolver } from 'interpreter/resolver';
import { Parser } from 'parser/parser';
import readline from 'readline';

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
  const statements = parser.parse();
  if (parser.hadError) {
    hadError = true;
    return;
  }

  // console.log(new AstPrinter().print(expr));

  const resolver = new Resolver(interpreter);
  resolver.resolveStmts(statements);
  if (resolver.hadError) {
    hadError = true;
    return;
  }

  hadRuntimeError = interpreter.interpret(statements);
}
