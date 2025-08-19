// lib/backend.js
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Detectar estructura de backend
function detectBackendStructure() {
  const root = process.cwd();
  const dirs = ['backend', 'api', 'server', 'functions'].map(dir => ({
    name: dir,
    exists: fs.existsSync(path.join(root, dir))
  }));

  const hasBackend = dirs.some(d => d.exists);
  return { dirs, hasBackend };
}

// Buscar endpoints clave en archivos .php, .js, .ts, etc.
function findApiEndpoints() {
  const root = process.cwd();
  const searchPaths = ['backend', 'api', 'server'].map(p => path.join(root, p)).filter(fs.existsSync);
  const endpoints = [];
  const targetRoutes = [
    '/user/drafts/cv',
    '/user/bookmarks',
    '/user/saved-searches',
    '/user/ai-interactions'
  ];

  const extensions = ['**/*.php', '**/*.js', '**/*.ts', '**/*.py', '**/*.go'];

  searchPaths.forEach(baseDir => {
    extensions.forEach(pattern => {
      try {
        const files = glob.sync(path.join(baseDir, pattern), {
          ignore: ['**/node_modules/**', '**/vendor/**']
        });

        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            targetRoutes.forEach(route => {
              if (line.includes(route)) {
                endpoints.push({
                  route,
                  file: path.relative(root, file),
                  line: index + 1
                });
              }
            });
          });
        });
      } catch (err) {
        console.warn('Error leyendo archivos backend:', err.message);
      }
    });
  });

  return endpoints;
}

export async function auditBackend() {
  const { hasBackend, dirs } = detectBackendStructure();
  const endpoints = findApiEndpoints();

  const required = [
    '/user/drafts/cv',
    '/user/bookmarks',
    '/user/saved-searches',
    '/user/ai-interactions'
  ];

  const found = required.filter(r => endpoints.some(e => e.route === r));
  const missing = required.filter(r => !found.includes(r));

  return {
    '✅ Backend: Estructura detectada': hasBackend
      ? { status: '✅', detail: dirs.filter(d => d.exists).map(d => d.name).join(', ') }
      : { status: '❌', detail: 'No se encontró carpeta backend/api' },

    '✅ Backend: Endpoints críticos': missing.length === 0
      ? { status: '✅', detail: `${found.length}/${required.length} encontrados` }
      : { status: '❌', detail: `${found.length}/${required.length} encontrados`, missing },

    '🔍 Backend: Rutas encontradas': endpoints.length > 0
      ? { status: '✅', detail: `${endpoints.length} rutas detectadas`, endpoints }
      : { status: '🟡', detail: 'No se encontraron endpoints clave' }
  };
}