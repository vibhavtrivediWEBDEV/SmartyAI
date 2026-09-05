/**
 * Backend Code Runner - Executes Python, Java, Node.js code
 * Captures stdout/stderr and returns as logs
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import ts from 'typescript';
import type { ConsoleLogEntry } from '@/lib/types/workspace';

const EXECUTION_TIMEOUT_MS = 8_000;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function appendLegacySolutionInvocation(code: string): string {
  const legacyExport = /module\.exports\s*=\s*\{\s*solution\s*\}\s*;?\s*$/;
  if (!legacyExport.test(code)) return code;

  return `${code}\n\nPromise.resolve(solution()).then((result) => {\n  if (result === undefined) {\n    console.log('[Runner] solution() returned undefined. Add your implementation or return a value.');\n    return;\n  }\n  console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));\n});\n`;
}

function runCommand(command: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd, env: process.env });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, EXECUTION_TIMEOUT_MS);

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    proc.on('close', (exitCode) => {
      clearTimeout(timeout);
      if (timedOut) {
        reject(new Error(`${stdout}${stderr}\nExecution stopped after ${EXECUTION_TIMEOUT_MS / 1000} seconds. Interactive input and long-running servers are not supported.`.trim()));
      } else if (exitCode === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || stdout || `Exit code: ${exitCode}`));
      }
    });
  });
}

/**
 * Execute Python code
 */
export async function executePython(code: string): Promise<ConsoleLogEntry[]> {
  const logs: ConsoleLogEntry[] = [];
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'python-'));
  const tmpFile = path.join(tmpDir, 'main.py');

  try {
    // Write code to temp file
    await fs.writeFile(tmpFile, code, 'utf-8');

    logs.push({
      id: generateId(),
      type: 'info',
      message: '🐍 Executing Python code...',
      timestamp: new Date().toISOString(),
    });

    // Execute Python
    const output = await runCommand('python3', [tmpFile], tmpDir);

    // Add output logs
    if (output.trim()) {
      output.split('\n').forEach((line) => {
        if (line.trim()) {
          logs.push({
            id: generateId(),
            type: 'log',
            message: line,
            timestamp: new Date().toISOString(),
          });
        }
      });
    }

    logs.push({
      id: generateId(),
      type: 'success',
      message: '✓ Python execution completed',
      timestamp: new Date().toISOString(),
    });

    return logs;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    logs.push({
      id: generateId(),
      type: 'error',
      message: `❌ Python Error: ${errorMsg}`,
      timestamp: new Date().toISOString(),
    });

    return logs;
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Execute Java code
 */
export async function executeJava(code: string): Promise<ConsoleLogEntry[]> {
  const logs: ConsoleLogEntry[] = [];
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'java-'));

  try {
    // Extract class name from code
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : 'Main';
    const javaFile = path.join(tmpDir, `${className}.java`);

    // Write code to temp file
    await fs.writeFile(javaFile, code, 'utf-8');

    logs.push({
      id: generateId(),
      type: 'info',
      message: '☕ Compiling Java code...',
      timestamp: new Date().toISOString(),
    });

    // Compile Java
    await runCommand('javac', [javaFile], tmpDir);

    logs.push({
      id: generateId(),
      type: 'success',
      message: '✓ Compilation successful',
      timestamp: new Date().toISOString(),
    });

    logs.push({
      id: generateId(),
      type: 'info',
      message: '☕ Executing Java code...',
      timestamp: new Date().toISOString(),
    });

    // Execute Java
    const output = await runCommand('java', ['-cp', tmpDir, className], tmpDir);

    // Add output logs
    if (output.trim()) {
      output.split('\n').forEach((line) => {
        if (line.trim()) {
          logs.push({
            id: generateId(),
            type: 'log',
            message: line,
            timestamp: new Date().toISOString(),
          });
        }
      });
    }

    logs.push({
      id: generateId(),
      type: 'success',
      message: '✓ Java execution completed',
      timestamp: new Date().toISOString(),
    });

    return logs;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    logs.push({
      id: generateId(),
      type: 'error',
      message: `❌ Java Error: ${errorMsg}`,
      timestamp: new Date().toISOString(),
    });

    return logs;
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Execute Node.js code
 */
export async function executeNode(code: string, isTypeScript = false): Promise<ConsoleLogEntry[]> {
  const logs: ConsoleLogEntry[] = [];
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'node-'));
  const tmpFile = path.join(tmpDir, 'index.js');

  try {
    // Write code to temp file
    const transpiledCode = isTypeScript
      ? ts.transpileModule(code, {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText
      : code;
    const executableCode = appendLegacySolutionInvocation(transpiledCode);
    await fs.writeFile(tmpFile, executableCode, 'utf-8');

    logs.push({
      id: generateId(),
      type: 'info',
      message: '📦 Executing Node.js code...',
      timestamp: new Date().toISOString(),
    });

    // Execute Node.js
    const output = await runCommand('node', [tmpFile], tmpDir);

    // Add output logs
    if (output.trim()) {
      output.split('\n').forEach((line) => {
        if (line.trim()) {
          logs.push({
            id: generateId(),
            type: 'log',
            message: line,
            timestamp: new Date().toISOString(),
          });
        }
      });
    } else {
      logs.push({
        id: generateId(),
        type: 'warn',
        message: 'Program finished with no output. Use console.log(...) or return a value from solution().',
        timestamp: new Date().toISOString(),
      });
    }

    logs.push({
      id: generateId(),
      type: 'success',
      message: '✓ Node.js execution completed',
      timestamp: new Date().toISOString(),
    });

    return logs;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    logs.push({
      id: generateId(),
      type: 'error',
      message: `❌ Node.js Error: ${errorMsg}`,
      timestamp: new Date().toISOString(),
    });

    return logs;
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}
