# 🔐 audit-storage — Tu guardián contra localStorage

¿Estás eliminando `localStorage` de tu app? Esta herramienta te ayuda a:
- 🔍 Detectar todos los usos de `localStorage` en tu frontend
- 📊 Generar un informe web claro (¡hasta para no técnicos!)
- ✅ Verificar que los datos del usuario ahora se guardan en backend
- 🚀 Ejecutar todo con un solo comando: 
`npx audit-storage run`

Perfecta para auditorías, migraciones y asegurar buenas prácticas de seguridad.


## 🚀 Instalación

```bash
npm install -D github:tu-usuario/audit-storage

📌 Uso
npx audit-storage run


Se generará un informe web interactivo en ./audit-storage-report/index.html y se abrirá automáticamente.

📊 Qué verifica
Uso indebido de localStorage en frontend
Presencia de backend/API
(Futuro) Estado de endpoints de sincronización
(Futuro) Pruebas dinámicas con Playwright

🛠 Desarrollo
git clone https://github.com/tu-usuario/audit-storage
cd audit-storage
npm install
npm test