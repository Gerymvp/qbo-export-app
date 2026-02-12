# 🚀 INICIO RÁPIDO - QBO-EXPORT-APP

**Para el próximo programador que trabaje en este proyecto.**

---

## ¿POR DÓNDE EMPIEZO?

### Opción 1: Primeros 15 minutos (Orientación Rápida)
1. Lee [GUIA_RAPIDA.md](GUIA_RAPIDA.md) - 10 minutos
2. Revisa esto mismo (`INICIO.md`) - 5 minutos
3. Abre los archivos clave en VS Code

### Opción 2: Entendimiento Profundo (1-2 horas)
1. Lee [DOC.md](DOC.md) - 60 minutos (skip secciones que no necesites)
2. Revisa [DIAGRAMAS.md](DIAGRAMAS.md) - 20 minutos (flujos OAuth y factura)
3. Explora código en `src/` siguiendo la arquitectura

### Opción 3: Implementación Rápida (Si tienes tarea específica)
1. Identifica en qué **página** o **componente** necesitas trabajar
2. Busca en [DOC.md - Sección 6](DOC.md#6-componentes-detallados)
3. Revisa [DIAGRAMAS.md](DIAGRAMAS.md) para el flujo relevante
4. Codea

---

## ESTRUCTURA DE DOCUMENTOS

| Documento | Para Qué | Cuándo Leer |
|-----------|----------|------------|
| **DOC.md** | Referencia completa y oficial | Setup inicial, preguntas profundas |
| **GUIA_RAPIDA.md** | Consulta rápida, comandos, troubleshooting | Buscar algo específico |
| **DIAGRAMAS.md** | Flujos y secuencias detalladas | Entender cómo funciona un feature |
| **INICIO.md** (este) | Empezar aquí | Siempre primero |

---

## CHECKLIST DE SETUP

1. **Clonar repo** ✓
   ```bash
   git clone <repo-url>
   cd qbo-export-app
   ```

2. **Instalar dependencias** ✓
   ```bash
   npm install
   ```

3. **Configurar .env.local** (CRÍTICO)
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   VITE_INTUIT_CLIENT_ID=ABK9ko4...
   ```
   → Sin esto, app NO funciona

4. **Verificar variables en Supabase** ✓
   - Dashboard → Project Settings → Secrets
   - Debe haber: `INTUIT_CLIENT_ID` y `INTUIT_CLIENT_SECRET`

5. **Iniciar dev server** ✓
   ```bash
   npm run dev
   ```
   → Abre http://localhost:5173/

6. **Test Login** ✓
   - Ingresa email/password creado en Supabase > Auth

7. **Test QB Connection** ✓
   - Click "Conectar QB" en Facturación
   - Deberías ser redirigido a Intuit
   - Después de autorizar, vuelves a la app

---

## CONCEPTOS CLAVE (3 min read)

### ¿Qué hace la app?

**Dashboard** → Gestión de inventario (productos)
- CSV o manual input
- Tabla editable
- Sincroniza a Supabase

**Facturación** → Procesa facturas XML
- Carga XML de factura electrónica panameña
- Parsea con `fast-xml-parser`
- Permite asignar cuentas QB
- Envía bill a QuickBooks Online

**Autenticación** → Supabase Auth + OAuth Intuit
- Login básico: email + password
- OAuth QB: autorización para acceder a QB

### Stack resumido
```
Frontend:   React 19 + Vite + Lucide Icons
Backend:    Supabase (PostgreSQL + Auth + Edge Functions)
External:   QuickBooks Online API + Intuit OAuth
```

---

## RESPUESTAS A PREGUNTAS FRECUENTES

### P: ¿Dónde está el código que conecta QB?
**A:** Flujo completo en [DIAGRAMAS.md - Sección 4](DIAGRAMAS.md#4-flujo-detallado-conexión-quickbooks-oauth)
- Frontend: `src/App.jsx` línea ~35-70
- Backend: `supabase/functions/qbo-oauth-handler/index.ts`

### P: ¿Dónde está la lógica de procesar facturas?
**A:** Toda en `src/hooks/useFacturacion.js`
- Parseo: `utils/xmlParser.js`
- Envío a QB: `services/qboService.js`

### P: ¿Cómo se comunica Frontend ↔ Backend?
**A:** Mediante Supabase
- DB: `.from(table).select()`, `.insert()`, etc.
- Functions: `.functions.invoke('nombre-función')`

### P: ¿Dónde editar credenciales (Client ID, Secret)?
**A:** 
- **Si es dev:** `.env.local`
- **Si es production:** Supabase Dashboard > Secrets
- No commitar `.env.local` a Git

### P: ¿Qué pasa si Token QB expira?
**A:** Actualmente el usuario debe reconectar.  
**TODO:** Implementar auto-refresh con `refresh_token`

### P: ¿Puedo agregar un nuevo componente?
**A:** 
1. Crea en `src/components/MiComponente.jsx`
2. Importa en la página donde lo uses
3. Props y state según necesidad
4. Sigue patrón de los actuales

### P: ¿Puedo cambiar la BD de Supabase a otra?
**A:** Técnicamente sí, pero requiere refactorizar. 
Se recomienda mantener Supabase por sus ventajas.

---

## ARCHIVOS MÁS IMPORTANTES (En orden de lectura)

```
1. src/App.jsx                    ← Entry point, gestiona sesión
   └─ Entiende: Auth flow, OAuth callback

2. src/pages/Facturacion.jsx      ← Vista principal facturación
   └─ Entiende: State flow con hooks

3. src/hooks/useFacturacion.js    ← LÓGICA actualización diaria
   └─ Entiende: Toda la lógica de negocio

4. src/utils/xmlParser.js         ← Parse de XML
   └─ Entiende: Estructura de factura panameña

5. src/services/qboService.js     ← Comunicación con QB
   └─ Entiende: Cómo se envían bills

6. src/lib/supabase.js            ← Configuración BD
   └─ Entiende: Cómo habla con Supabase

7. supabase/functions/*/index.ts  ← Backend
   └─ Entiende: Lógica del servidor
```

---

## DEBUGGING RÁPIDO

**App en blanco?**
```
1. Abre DevTools (F12)
2. Console tab
3. Busca errores rojos
4. Usualmente: .env mal configurado
```

**Error CORS?**
```
1. No es error de tu código
2. Redirect URI en Intuit no coincide
3. Verifica: Intuit Developer > Settings
```

**Factura no parsea?**
```
1. Add: console.log(JSON.stringify(jsonObj, null, 2))
   en xmlParser.js línea ~20
2. Inspecciona estructura
3. Puede ser versión diferente de XML
```

**Token expirado?**
```
1. Reconecta QB (Flutter refresh token después)
2. Verifica en Supabase tabla qbo_tokens
3. Check expires_at timestamp
```

---

## TAREAS COMUNES

### Agregar nuevo campo a producto
1. Agregar a formulario: `src/components/ManualForm.jsx`
2. Agregar a tabla: `src/components/ReviewTable.jsx`
3. Agregar a DB schema: Supabase SQL
4. Agregar a validación: Dashboard.jsx

### Modificar parseo XML
1. Editar: `src/utils/xmlParser.js`
2. Test: Carga un XML real
3. Check console.log para ver estructura
4. Ajusta paths según necesidad

### Agregar nueva página
1. Create: `src/pages/MiPagina.jsx`
2. Import en: `src/App.jsx`
3. Add route en Sidebar
4. Link en navegación

### Conectar nuevo servicio externo
1. Crear función en: `src/services/miServicio.js`
2. O agregar Edge Function en: `supabase/functions/mi-funcion/`
3. Llamar desde componente/hook
4. Manejar errores

---

## MEJORAS PENDIENTES (Para Next Engineer)

**Priority 1 (Crítico)**
- [ ] Implementar auto-refresh de tokens QB
- [ ] Agregar validación de CUFE (fiscal)
- [ ] Mejorar error handling global

**Priority 2 (Importante)**
- [ ] Webhook para carga automática de facturas
- [ ] Tests automatizados (vitest)
- [ ] Logging centralizado (Sentry)

**Priority 3 (Nice to have)**
- [ ] Multi-company por usuario
- [ ] OCR para PDF/images (Tesseract ya importado)
- [ ] Reportes dashboard
- [ ] Sincronización bidireccional con QB

Ver [DOC.md - Sección 15](DOC.md#15-notas-para-el-próximo-programador) para detalles.

---

## RECURSOS ÚTILES

### Documentación Externa
- [Supabase Docs](https://supabase.com/docs)
- [Intuit QB API](https://developer.intuit.com/)
- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)

### Comandos Usados Frecuentemente
```bash
npm run dev              # Dev server local
npm run build            # Build para producción
npm run lint             # Chequear código
npm run preview          # Ver build localmente

# Supabase CLI (si necesitas)
supabase login           # Autenticate
supabase functions deploy <name>  # Deploy function
supabase db pull         # Reflejar cambios BD localmente
```

### Contraseñas/Keys a Guardar
- **Supabase URL & Key** → .env.local
- **Intuit Client Secret** → Supabase Secrets (NO .env)
- **DB Password** → Supabase account (NO código)

---

## QUICK WINS (Mejoras Fáciles para Empezar)

Si eres nuevo y quieres contribuir quick:

1. **Agregar validación SVG en ReviewTable**
   - Archivo: `src/components/ReviewTable.jsx`
   - Tarea: Mostrar ✓ o ✗ si campo es válido
   - Difficulty: 🟢 Fácil

2. **Mejorar error messages**
   - Archivos: Todos los `.jsx`
   - Tarea: Cambiar `alert()` por notificaciones bonitas
   - Difficulty: 🟡 Media

3. **Agregar Loading spinner**
   - Archivo: `src/components/`
   - Tarea: Mostrar loader mientras carga QB data
   - Difficulty: 🟡 Media

4. **Agregar tests para xmlParser**
   - Archivo: Nuevo `__tests__/xmlParser.test.js`
   - Tarea: Tests para parseInvoiceXML()
   - Difficulty: 🟡 Media

5. **Mejorar UI/UX con Tailwind**
   - Archivos: CSS → Tailwind classes
   - Tarea: Refactor estilos (larga pero rewarding)
   - Difficulty: 🔴 Larga

---

## SOPORTE & CONTACTO

**Si tienes dudas:**
1. Revisa [GUIA_RAPIDA.md](GUIA_RAPIDA.md) sección FAQ
2. Busca en [DOC.md](DOC.md) (Ctrl+F es tu amigo)
3. Revisa [DIAGRAMAS.md](DIAGRAMAS.md) para flujo específico
4. Chequea los comentarios en el código (hay muchos 📝)

**Si encuentras bug:**
- Documenta: Qué hiciste, qué esperabas, qué pasó
- Chequea [GUIA_RAPIDA.md - Troubleshooting](GUIA_RAPIDA.md#-diagnostico-rápido)
- Revisa logs en Browser Console y Supabase Logs

---

## RESUMEN EN 30 SEGUNDOS

**¿Qué es?** App de inventario + facturación que integra con QuickBooks.  
**¿Cómo funciona?** React frontend → Supabase backend → QB API.  
**¿Dónde empiezo?** Lee GUIA_RAPIDA.md, luego DOC.md cuando necesites detalles.  
**¿Cómo hago cambios?** Edita en src/, testea en localhost:5173, commit, push.  
**¿Problemas?** Console.log liberalmente, revisa Supabase logs, lee troubleshooting.

---

## MAPA MENTAL DE LA APP

```
                              QBO-EXPORT-APP
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                [ AUTH ]       [ INVENTORY ]  [ INVOICES ]
                    │              │              │
              Login with       ┌─ CSV            XML
              email/pass        ├─ Manual Form   Upload
    Supabase Auth │          ├─ Edit inline    Parse
                    │          └─ Sync to BD    Edit
                    │                           Send to QB
                    │
                    └─ JWT Token in sessionStorage
                       └─ Active mientras el tab esté abierto
```

---

## PRÓXIMOS PASOS

1. **Hoy:** Setup + tour de código (2 horas)
2. **Mañana:** Entiende un flujo específico (1-2 horas)
3. **Después:** Haz tu primer cambio (30 min - 1 hora)
4. **Semana 1:** Completa tus tareas asignadas

---

**¡Bienvenido al equipo!** 🎉

Si tienes dudas sobre cualquier parte, los documentos están aquí para ayudarte.

Última actualización: Febrero 12, 2026

