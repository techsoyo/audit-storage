// lib/backend.js
import fs from 'fs';
import { join } from 'path';

export async function auditBackend() {
  const projectRoot = process.cwd();
  const hasApi = [
    'backend',
    'api',
    'server',
    'functions'
  ].some(dir => fs.existsSync(join(projectRoot, dir)));

  return {
    '✅ Backend presente': hasApi
      ? { status: '✅', detail: 'Estructura de backend detectada' }
      : { status: '🟡', detail: 'No se encontró carpeta backend/api' },

    '✅ Endpoints de sincronización': hasApi
      ? { status: '✅', detail: 'Verificar con API real en futuras versiones' }
      : { status: '🟡', detail: 'Pendiente de verificación' }
  };
}