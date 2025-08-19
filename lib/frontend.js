// lib/frontend.js
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { parse } from 'acorn';
import { simple } from 'acorn-walk';

/**
 * Analiza si hay uso real de localStorage usando AST
 * Evita falsos positivos (comentarios, strings, etc.)
 */
function findLocalStorageUsage(content, filePath) {
  const findings = [];

  try {
    const ast = parse(content, {
      ecmaVersion: 2022,
      sourceType: 'module',
      locations: true
    });

    simple(ast, {
      MemberExpression(node) {
        // Detectar: localStorage.setItem, localStorage.getItem, etc.
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'localStorage'
        ) {
          findings.push({
            file: filePath,
            line: node.loc?.start.line || 0,
            column: node.loc?.start.column || 0,
            code: content.split('\n')[node.loc?.start.line - 1]?.trim(),
            type: 'direct-access'
          });
        }

        // Detectar: const storage = localStorage; storage.setItem(...)
        if (
          node.object.type === 'Identifier' &&
          isLocalStorageAlias(node.object.name, ast, content)
        ) {
          findings.push({
            file: filePath,
            line: node.loc?.start.line || 0,
            column: node.loc?.start.column || 0,
            code: content.split('\n')[node.loc?.start.line - 1]?.trim(),
            type: 'alias-access',
            variable: node.object.name
          });
        }
      }
    });
  } catch (err) {
    // Ignorar archivos que no son JS/TS válidos (ej: .min.js)
    console.debug(`[AST] No se pudo analizar ${filePath}: ${err.message}`);
  }

  return findings;
}

/**
 * Verifica si un identificador es un alias de localStorage
 * Ej: const storage = localStorage;
 */
function isLocalStorageAlias(name, ast, content) {
  let isAlias = false;

  try {
    simple(ast, {
      VariableDeclarator(node) {
        if (
          node.id.type === 'Identifier' &&
          node.id.name === name &&
          node.init?.type === 'Identifier' &&
          node.init.name === 'localStorage'
        ) {
          isAlias = true;
        }
      }
    });
  } catch (err) {
    console.warn(`Error analizando alias ${name}:`, err.message);
  }

  return isAlias;
}

/**
 * Busca archivos JS/TS en src/ y analiza con AST
 */
export async function auditFrontend() {
  const root = process.cwd();
  const srcDirs = ['src', 'frontend', 'client', 'app']
    .map(dir => path.join(root, dir))
    .filter(dir => fs.existsSync(dir));

  const patterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
  let allFindings = [];

  for (const srcDir of srcDirs) {
    for (const pattern of patterns) {
      try {
        const files = glob.sync(path.join(srcDir, pattern), {
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/*.test.*',
            '**/*.spec.*',
            '**/.*',
            '**/vendor/**'
          ],
          nodir: true
        });

        for (const file of files) {
          const content = fs.readFileSync(file, 'utf8');
          const relativeFile = path.relative(root, file);
          const findings = findLocalStorageUsage(content, relativeFile);
          allFindings.push(...findings);
        }
      } catch (err) {
        console.warn(`Error buscando archivos en ${srcDir}:`, err.message);
      }
    }
  }

  return {
    '🔎 Frontend: Uso de localStorage': allFindings.length === 0
      ? { status: '✅', detail: 'No se encontró acceso real a localStorage' }
      : {
        status: '❌',
        detail: `Encontrado en ${allFindings.length} lugar(es)`,
        findings: allFindings.map(f => ({
          Archivo: f.file,
          Línea: f.line,
          Tipo: f.type === 'direct-access' ? 'Acceso directo' : 'Alias',
          Código: f.code
        }))
      }
  };
}