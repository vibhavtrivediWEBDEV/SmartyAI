/**
 * Backend Code Runner - Executes Python, Java, Node.js code
 * Captures stdout/stderr and returns as logs
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import type { ConsoleLogEntry } from '@/lib/types/workspace';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    const output = await new Promise<string>((resolve, reject) => {
      const proc = spawn('python3', [tmpFile], {
        cwd: tmpDir,
        env: process.env,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Exit code: ${code}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });

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
    const compileOutput = await new Promise<string>((resolve, reject) => {
      const proc = spawn('javac', [javaFile], {
        cwd: tmpDir,
      });

      let stderr = '';
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve('Compilation successful');
        } else {
          reject(new Error(stderr || 'Compilation failed'));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });

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
    const output = await new Promise<string>((resolve, reject) => {
      const proc = spawn('java', ['-cp', tmpDir, className], {
        cwd: tmpDir,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Exit code: ${code}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });

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
export async function executeNode(code: string): Promise<ConsoleLogEntry[]> {
  const logs: ConsoleLogEntry[] = [];
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'node-'));
  const tmpFile = path.join(tmpDir, 'index.js');

  try {
    // Write code to temp file
    await fs.writeFile(tmpFile, code, 'utf-8');

    logs.push({
      id: generateId(),
      type: 'info',
      message: '📦 Executing Node.js code...',
      timestamp: new Date().toISOString(),
    });

    // Execute Node.js
    const output = await new Promise<string>((resolve, reject) => {
      const proc = spawn('node', [tmpFile], {
        cwd: tmpDir,
        env: process.env,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Exit code: ${code}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });

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
