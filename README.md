# 📦 Sistema de Gestión de Inventario para QuickBooks Online

Plataforma web full-stack desarrollada en **React (Vite)** y **Supabase** diseñada para optimizar el control de inventarios, automatizar reglas de costos con proveedores y facilitar la exportación de catálogos compatibles con QuickBooks Online (QBO).

---

## 🚀 Características Principales
- **Ingreso Manual Inteligente:** Formulario automatizado que calcula costos y descuentos basados en políticas comerciales de proveedores mediante recursividad.
- **Bandeja de Revisión en Tiempo Real:** Tabla interactiva para validación de datos, detección automática de SKUs duplicados y control de estados (locales vs. sincronizados).
- **Extracción y Scraper:** Módulos de soporte para carga masiva de datos y procesamiento automatizado.
- **Sincronización Cloud:** Conexión directa con PostgreSQL a través de Supabase con políticas de seguridad y operaciones de `upsert`.
- **Exportación QBO:** Generación de reportes estructurados en formato CSV listos para importar a QuickBooks Online.

---

## 🛠️ Tecnologías Utilizadas
- **Frontend:** React, Vite, JavaScript (ES6+), Lucide React
- **Estilos:** CSS Modules / Estilos personalizados adaptativos
- **Backend & Base de Datos:** Supabase (PostgreSQL, BaaS)
- **Utilidades:** PapaParse (para manejo de CSV)
- **Calidad y Testing (QA):** **Playwright** (Pruebas E2E automatizadas)

---

## 🧪 Pruebas Automatizadas (QA E2E)
El proyecto incluye una suite de pruebas End-to-End implementada con **Playwright** para garantizar la estabilidad de los flujos críticos de la interfaz y la reactividad de los componentes.

### ¿Qué evalúan las pruebas?
1. **Autenticación:** Inicio de sesión correcto y carga inicial del Dashboard.
2. **Formulario Manual:** Simulación de llenado de datos (proveedor, categoría, nombre, SKU, precio y costo).
3. **Validación de UI:** Comprobación de que al enviar el formulario, el contador de la bandeja se actualiza dinámicamente a `Revisión (1)` y el producto aparece reflejado correctamente en la tabla.

### ¿Cómo ejecutar las pruebas?
Asegúrate de tener la aplicación corriendo localmente y ejecuta los siguientes comandos en tu terminal:

```bash
# Instalar dependencias (si aún no lo has hecho)
npm install

# Instalar los navegadores de Playwright
npx playwright install

# Ejecutar las pruebas en modo headless
npx playwright test

# Ejecutar las pruebas con interfaz visual de Playwright
npx playwright test --ui