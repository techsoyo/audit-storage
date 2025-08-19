// lib/frontend.js
import fs from 'fs';
import glob from 'glob';
import { join, relative } from 'path';

export async function auditFrontend() {
  const srcPaths = ['src', 'frontend', 'client', 'app'].filter(dir => {
    try {
      return fs.statSync(join(process.cwd(), dir)).isDirectory();
    } catch {
      return false;
    }
  });

  const patterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
  let findings = [];

  for (const src of srcPaths) {
    for (const pattern of patterns) {
      const searchPath = join(process.cwd(), src, pattern);
      const files = glob.sync(searchPath, {
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/*.test.*',
          '**/*.spec.*'
        ],
        nodir: true
      });

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('localStorage')) {
          // Ruta relativa al proyecto del usuario
          const relFile = relative(process.cwd(), file);
          findings.push({
            file: relFile,
            issue: 'Uso de localStorage detectado',
            recommendation: 'Migrar a backend o usar sessionStorage temporal'
          });
        }
      });
    }
  }

  return {
    '🔎 localStorage usado en frontend': findings.length === 0
      ? { status: '✅', detail: 'No se encontró uso de localStorage' }
      : { status: '❌', detail: `Encontrado en ${findings.length} archivos`, findings }
  };
}