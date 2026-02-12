# 🗂️ GUÍA RÁPIDA DE REFERENCIA - QBO-EXPORT-APP

Documento complementario a DOC.md para consultas rápidas.

---

## 📍 RUTAS DE ARCHIVOS CRÍTICOS

```
src/
  ├── App.jsx                    ← PUNTO DE ENTRADA - Maneja sesión
  ├── pages/
  │   ├── Dashboard.jsx          ← Inventario (productos)
  │   └── Facturacion.jsx        ← Facturas XML → QB
  ├── hooks/
  │   └── useFacturacion.js      ← LÓGICA CENTRAL facturación
  ├── services/
  │   └── qboService.js          ← Envía bills a QB
  ├── lib/
  │   └── supabase.js            ← Configuración DB
  └── utils/
      └── xmlParser.js           ← Parsea XML panameño

supabase/
  └── functions/
      ├── qbo-oauth-handler/     ← OAuth flow
      ├── create-qbo-bill/       ← Crear bill en QB
      ├── get-qbo-accounts/      ← Listar cuentas
      └── get-qbo-vendors/       ← Listar proveedores
```

---

## 🔄 FLUJOS RÁPIDOS

### Login
```
email/password → supabase.auth → ✅ session → Dashboard
```

### Conectar QB
```
Click "Conectar" → Intuit OAuth → code+realmId → qbo-oauth-handler
→ exchange code → save token en BD → localStorage
```

### Factura XML
```
XML file → parseInvoiceXML() → invoiceData → tabla editable
→ select vendor + cuentas → enviarAQuickBooks() → Bill en QB
```

### Productos
```
CSV/Manual → productos[] → ReviewTable → Sincronizar
→ upsert en BD
```

---

## 📊 TABLAS DB

| Tabla | Uso | Campos Clave |
|-------|-----|-------------|
| `usuarios` | Perfiles extendidos | id, email, nombre |
| `productos` | Catálogo | sku (único), nombre, precio |
| `qbo_tokens` | OAuth tokens | user_id (único), access_token |
| `facturas_pendientes` | Bandeja entrada | cufe (único), status, xml_content |
| `politicas_comerciales` | Config negocio | nombre, descuento, plazo |

---

## 🔌 API ENDPOINTS (Edge Functions)

| Función | Método | Input | Output |
|---------|--------|-------|--------|
| `qbo-oauth-handler` | POST | {code, realmId, userId} | {message: ok} |
| `create-qbo-bill` | POST | {realmId, token, bill} | {Bill object} |
| `get-qbo-accounts` | POST | {realmId} | {accounts: []} |
| `get-qbo-vendors` | POST | {realmId} | {vendors: []} |

---

## 🪝 HOOKS

### `useFacturacion()`
```javascript
Retorna:
  - invoiceData: Object|null
  - isConnected: Boolean
  - realmId: String|null
  - pendientes: Array
  - qboAccounts: Array
  - qboVendors: Array
  
Funciones:
  - processNewInvoice(xml, dbId)
  - handleUpdateItem(index, field, value)
  - enviarAQuickBooks()
  - fetchPendientes()
  - fetchQboAccounts()
  - fetchQboVendors()
```

---

## ⚙️ CONFIGURACIÓN REQUERIDA

**.env.local**
```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=ey...
VITE_INTUIT_CLIENT_ID=ABK...
```

**Supabase Secrets**
```
INTUIT_CLIENT_ID=ABK...
INTUIT_CLIENT_SECRET=...
```

---

## 🚀 COMANDOS PRINCIPALES

```bash
npm run dev       # Iniciar dev server
npm run build     # Build production
npm run lint      # Chequear código
npm run preview   # Preview build

supabase functions deploy <name>  # Deploy Edge Function
```

---

## 🔐 CREDENCIALES (Dónde guardar)

| Credencial | Dónde | Seguridad |
|-----------|-------|----------|
| Supabase URL | .env.local | Pública |
| Supabase Anon Key | .env.local | Pública |
| Intuit Client ID | .env.local | Pública |
| Intuit Client Secret | Supabase Secrets | ⚠️ PRIVADA |
| DB Password | Supabase Account | ⚠️ PRIVADA |

**⚠️ NUNCA commiter .env.local o secrets!**

---

## 🆘 DIAGNOSTICO RÁPIDO

**Problem: Página en blanco**
→ Check browser console para errores  
→ Verificar .env.local variables

**Problem: No puedo loguearme**
→ Verificar email existe en Supabase Auth  
→ Verificar tabla usuarios poblada

**Problem: CORS error en QB**
→ Revisar redirect URI en Intuit  
→ Limpiar cache + cookies

**Problem: Factura no procesa**
→ Verificar vendor seleccionado  
→ Verificar cuentas asignadas a items  
→ Revisar logs de create-qbo-bill en Supabase

**Problem: XML parse error**
→ Revisar formato en console.log(jsonObj)  
→ Puede ser versión diferente de estándar

---

## 📱 COMPONENTES CLAVE

### App.jsx
**Responsabilidades**:
- ✅ Manejo de sesión Supabase
- ✅ OAuth callback handling
- ✅ Routing entre páginas
- ✅ Carga de políticas

### Dashboard.jsx
**Responsabilidades**:
- ✅ Estado de productos
- ✅ Agregar/editar/borrar
- ✅ Cargar desde BD
- ✅ Sincronizar a BD

### Facturacion.jsx
**Responsabilidades**:
- ✅ Renderizar componentes de facturación
- ✅ Pasar data a child components
- ✅ Manejar eventos de UI

### useFacturacion.js
**Responsabilidades**:
- ✅ Toda la lógica de facturación
- ✅ Suscripción a cambios BD
- ✅ Fetch de datos QBO
- ✅ Parse de XML
- ✅ Envío a QB

---

## 🔄 EVENT FLOW

```
┌─────────────────────────────────────────┐
│         USER ACTION (Click, Input)      │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │  Component Handler
        │  (onClick, onChange)
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  Hook Function
        │  (useFacturacion)
        └────────┬────────┘
                 │
        ┌────────▼─────────────┐
        │  Supabase API Call
        │  (.from/.functions)
        └────────┬─────────────┘
                 │
        ┌────────▼─────────────┐
        │  Edge Function
        │  (Backend logic)
        └────────┬─────────────┘
                 │
        ┌────────▼─────────────┐
        │  External API
        │  (QB, OAuth, etc)
        └────────┬─────────────┘
                 │
        ┌────────▼─────────────┐
        │  Return Response
        └────────┬─────────────┘
                 │
        ┌────────▼────────┐
        │  Update State
        │  (setInvoiceData)
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  Re-Render UI
        └─────────────────┘
```

---

## ✅ DEPLOY CHECKLIST

- [ ] Todas las variables de entorno configuradas
- [ ] Edge Functions deployadas (supabase functions deploy)
- [ ] RLS policies habilitadas en todas las tablas
- [ ] Redirect URI en Intuit = dominio final
- [ ] Tests pasando (npm run lint)
- [ ] Build sin errores (npm run build)
- [ ] variables.env actualizado en servidor
- [ ] Base de datos respaldos automáticos activados
- [ ] HTTPS configurado en servidor
- [ ] Monitoreo (errores, logs) configurado

---

## 📞 QUICK FAQ

**P: ¿Dónde se guardan los tokens QB?**  
R: Tabla `qbo_tokens` en Supabase

**P: ¿Qué pasa si token QB expira?**  
R: Actualmente: Usuario debe reconectar. Mejorable: Auto-refresh con refresh_token

**P: ¿Soporta múltiples usuarios?**  
R: Sí, pero un QB per usuario. Mejorable: Multi-company per user

**P: ¿Se puede cargar facturas automáticamente?**  
R: No, manual. Mejorable: Webhook para auto-upload desde email

**P: ¿Hay OCR para escaneo?**  
R: Tesseract.js importado pero no usado. Pendiente implementación

**P: ¿Base de datos está respaldada?**  
R: Sí, Supabase respaldos automáticos diarios

**P: ¿Cuánto cuesta Supabase?**  
R: Gratis hasta ciertos limits. Luego $25/mes base

**P: ¿Puedo cambiar a otra BD?**  
R: Técnicamente sí, pero requiere refactorizar. Supabase es optimal

---

## 🎯 NEXT ENGINEER PRIORITY

1. **Asegurar**:
   - [ ] Entender flujo OAuth
   - [ ] Entender xmlParser.js
   - [ ] Mapeo producto → QB bill

2. **Mejorar**:
   - [ ] Auto-refresh tokens
   - [ ] Error handling robusto
   - [ ] Validaciones fiscales (CUFE, RUC)

3. **Agregar**:
   - [ ] Webhook para facturas
   - [ ] OCR para PDF/images
   - [ ] Reportes dashboard
   - [ ] Tests automatizados

---

**Documento: Guía Rápida de Referencia**  
**Creado**: Febrero 12, 2026  
**Propósito**: Consulta rápida para next engineer  
**Mantener sincronizado con**: DOC.md

