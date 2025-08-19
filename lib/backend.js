// lib/backend.js
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Endpoints clave que debemos encontrar
const targetActions = [
  'save_cv_draft',
  'add_bookmark',
  'remove_bookmark',
  'save_search',
  'ai_interaction'
];

// Mapeo de acciones a rutas lógicas (para el reporte)
const actionToRoute = {
  'save_cv_draft': '/user/drafts/cv',
  'add_bookmark': '/user/bookmarks',
  'remove_bookmark': '/user/bookmarks',
  'save_search': '/user/saved-searches',
  'ai_interaction': '/user/ai-interactions'
};

export async function auditBackend() {
  const root = process.cwd();
  const backendDirs = ['backend', 'api', 'server', 'includes'].filter(dir =>
    fs.existsSync(path.join(root, dir))
  );

  const hasBackend = backendDirs.length > 0;
  const endpoints = [];

  // Buscar archivos .php, .inc
  const searchPatterns = ['**/*.php', '**/*.inc'];

  for (const dir of backendDirs) {
    try {
      const baseDir = path.join(root, dir);
      for (const pattern of searchPatterns) {
        const files = glob.sync(path.join(baseDir, pattern), {
          ignore: ['**/vendor/**', '**/tests/**', '**/*.test.php']
        });

        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n');

          targetActions.forEach(action => {
            // Buscar: $_POST['action'] === 'save_cv_draft'
            const regex = new RegExp(`\\$_POST\\s*\\[\\s*['"]action['"]\\s*\\]\\s*==?=?\\s*['"]${action}['"]`);
            if (lines.some(line => regex.test(line))) {
              endpoints.push({
                route: actionToRoute[action],
                action,
                file: path.relative(root, file),
                line: lines.findIndex(line => regex.test(line)) + 1,
                type: 'php-action'
              });
            }

            // Buscar: case 'save_cv_draft':
            const caseRegex = new RegExp(`case\\s+['"]${action}['"]\\s*:`);
            if (lines.some(line => caseRegex.test(line))) {
              endpoints.push({
                route: actionToRoute[action],
                action,
                file: path.relative(root, file),
                line: lines.findIndex(line => caseRegex.test(line)) + 1,
                type: 'php-case'
              });
            }
          });
        });
      }
    } catch (err) {
      console.warn('Error leyendo archivos backend:', err.message);
    }
  }

  const foundRoutes = [...new Set(endpoints.map(e => e.route))];
  const missingRoutes = Object.values(actionToRoute).filter(route => !foundRoutes.includes(route));

  return {
    '✅ Backend: Estructura detectada': hasBackend
      ? { status: '✅', detail: backendDirs.join(', ') }
      : { status: '❌', detail: 'No se encontró carpeta backend/api' },

    '✅ Backend: Endpoints críticos': missingRoutes.length === 0
      ? { status: '✅', detail: `${foundRoutes.length}/5 encontrados` }
      : { status: '❌', detail: `${foundRoutes.length}/5 encontrados`, missing: missingRoutes },

    '🔍 Backend: Acciones detectadas': endpoints.length > 0
      ? {
        status: '✅',
        detail: `${endpoints.length} acciones encontradas`,
        endpoints: endpoints.map(e => ({
          Ruta: e.route,
          Acción: e.action,
          Archivo: e.file,
          Línea: e.line
        }))
      }
      : { status: '🟡', detail: 'No se encontraron acciones clave' }
  };
}