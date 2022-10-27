import { readFileSync } from 'fs';
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

let hadError = false;

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
  if (expr == null || hadError) {
    hadError = false;
    return;
  }

  console.log(new AstPrinter().print(expr));
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

export function report(line: number, where: string, message: string) {
  console.error(`[line ${line}] Error ${where}: ${message}`);
  hadError = true;
}
