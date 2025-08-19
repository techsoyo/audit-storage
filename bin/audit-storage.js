#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Command } from 'commander';
import { auditFrontend } from '../lib/frontend.js';
import { auditBackend } from '../lib/backend.js';
import { generateReport } from '../lib/report/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('audit-storage')
  .description('Audita el uso de localStorage y migración a backend')
  .version('1.0.0');

program
  .command('run')
  .description('Ejecuta la auditoría completa')
  .option('-o, --output <path>', 'Carpeta de salida', './audit-storage-report')
  .action(async (options) => {
    // Ruta absoluta relativa al CWD (proyecto del usuario)
    const outputDir = join(process.cwd(), options.output);

    console.log('🔍 Iniciando auditoría de localStorage...\n');

    const results = {
      timestamp: new Date().toISOString(),
      summary: { passed: 0, failed: 0, total: 0 },
      frontend: await auditFrontend(),
      backend: await auditBackend(),
    };

    // Contar resultados
    const count = (obj) => {
      Object.values(obj).forEach(v => {
        if (v.status === '✅') results.summary.passed++;
        else results.summary.failed++;
        results.summary.total++;
      });
    };
    count(results.frontend);
    count(results.backend);

    // Generar reporte en el proyecto del usuario
    await generateReport(results, outputDir);

    console.log(`\n✅ Auditoría completada.`);
    console.log(`📄 Reporte generado en: ${outputDir}`);
    console.log(`👉 Abriendo navegador...`);

    try {
      await import('open').then(m => m.default(`file://${outputDir}/index.html`));
    } catch (err) {
      console.warn('No se pudo abrir el navegador automáticamente.');
      console.log(`Abre manualmente: ${outputDir}/index.html`);
    }
  });

program.parse();