import { readFileSync } from 'fs';
import readline from 'readline';

import { Scanner } from './scanner/scanner';

const args = process.argv.slice(2);
console.log(args);

if (args.length > 1) {
  console.log('Usage: jlox [script]');
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
  tokens.forEach((x) => console.log(x));
}

export function error(line: number, message: string) {
  report(line, '', message);
}

export function report(line: number, where: string, message: string) {
  console.error(`[line ${line}] Error ${where}: ${message}`);
  hadError = true;
}
