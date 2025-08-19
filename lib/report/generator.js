// lib/report/generator.js
import fs from 'fs-extra';
import path from 'path';

export async function generateReport(results, outputDir) {
  const indexHtml = path.join(outputDir, 'index.html');
  const styleCss = path.join(outputDir, 'style.css');
  const scriptJs = path.join(outputDir, 'script.js');
  const dataJson = path.join(outputDir, 'data.json');

  // Asegurar que la carpeta exista
  await fs.ensureDir(outputDir);

  // Generar HTML
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Auditoría de Almacenamiento</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="container">
    <h1>🔍 Auditoría de Almacenamiento</h1>
    <p class="timestamp">Ejecutada: ${new Date(results.timestamp).toLocaleString()}</p>

    <div class="summary">
      <h2>📊 Resumen</h2>
      <p class="passed">✅ Pasadas: ${results.summary.passed}</p>
      <p class="failed">❌ Fallidas: ${results.summary.failed}</p>
      <p class="total">📋 Total: ${results.summary.total}</p>
      <p class="grade">${results.summary.failed === 0 ? '🎯 ¡Perfecto!' : '⚠️ Requiere atención'}</p>
    </div>

    <details open>
      <summary>🟢 Frontend</summary>
      ${renderSection(results.frontend)}
    </details>

    <details open>
      <summary>🟢 Backend</summary>
      ${renderSection(results.backend)}
    </details>

    <footer>
      <p>Generado por <strong>audit-storage</strong> (CLI)</p>
    </footer>
  </div>
  <script src="script.js"></script>
</body>
</html>`;

  const css = `
body { font-family: -apple-system, sans-serif; background: #f4f4f4; color: #333; }
.container { max-width: 900px; margin: 40px auto; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
h1 { color: #1a73e8; text-align: center; }
h2 { color: #1a73e8; }
summary { font-weight: bold; cursor: pointer; margin: 10px 0; }
summary::marker { content: "▶"; }
details[open] summary::marker { content: "▼"; }
.summary { background: #e8f0fe; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
.passed { color: green; font-weight: bold; }
.failed { color: red; font-weight: bold; }
.total { color: #555; }
.grade { font-size: 1.2em; font-weight: bold; color: ${results.summary.failed === 0 ? 'green' : 'orange'}; }
footer { text-align: center; margin-top: 40px; color: #777; }
.findings { margin: 10px 0; font-size: 0.9em; color: #555; }
  `;

  const js = `
    document.querySelectorAll('details').forEach(detail => {
      detail.addEventListener('toggle', () => {
        localStorage.setItem('audit-' + detail.querySelector('summary').textContent, detail.open);
      });
      const saved = localStorage.getItem('audit-' + detail.querySelector('summary').textContent);
      if (saved !== null) detail.open = saved === 'true';
    });
  `;

  // Escribir archivos
  await fs.writeFile(indexHtml, html);
  await fs.writeFile(styleCss, css);
  await fs.writeFile(scriptJs, js);
  await fs.writeJSON(dataJson, results, { spaces: 2 });
}

function renderSection(section) {
  return Object.entries(section)
    .map(([key, value]) => {
      const data = value.findings ?
        `<div class="findings"><ul>${value.findings.map(d => `<li><strong>${d.file}</strong>: ${d.issue}</li>`).join('')}</ul></div>` : '';
      return `<p><strong>${key}:</strong> <span class="${value.status === '✅' ? 'ok' : 'error'}">${value.status} ${value.detail}</span></p>${data}`;
    })
    .join('');
}