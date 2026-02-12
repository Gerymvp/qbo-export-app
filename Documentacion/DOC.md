# 📚 DOCUMENTACIÓN COMPLETA - QBO-EXPORT-APP

**Última actualización:** Febrero 12, 2026  
**Versión:** 1.0.0  
**Responsable Inicial:** Sistema de Inventario y Facturación - Librería Cristiana Peniel

---

## 📋 ÍNDICE

1. [Descripción General](#1-descripción-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura General](#3-arquitectura-general)
4. [Estructura de Carpetas](#4-estructura-de-carpetas)
5. [Páginas Principales](#5-páginas-principales)
6. [Componentes Detallados](#6-componentes-detallados)
7. [Hooks Personalizados](#7-hooks-personalizados)
8. [Servicios](#8-servicios)
9. [Base de Datos (Supabase)](#9-base-de-datos-supabase)
10. [Edge Functions (Backend)](#10-edge-functions-backend)
11. [Flujos de Datos](#11-flujos-de-datos)
12. [Configuración Inicial](#12-configuración-inicial)
13. [Guía de Ejecución](#13-guía-de-ejecución)
14. [Troubleshooting](#14-troubleshooting)
15. [Notas para el Próximo Programador](#15-notas-para-el-próximo-programador)

---

## 1. DESCRIPCIÓN GENERAL

### ¿Qué es QBO-Export-App?

Es una aplicación web moderna de **gestión de inventario y facturación** con integración directa a **QuickBooks Online (QBO)**.

### Objetivos Principales

✅ **Gestión de Inventario**: Agregar, actualizar y sincronizar productos con Supabase  
✅ **Integración QBO**: Conectarse con QuickBooks Online mediante OAuth 2.0  
✅ **Procesamiento de Facturas**: Parsear archivos XML de facturas electrónicas panameñas  
✅ **Sincronización Automática**: Enviar facturas procesadas directamente a QBO  
✅ **Autenticación Segura**: Sistema de login con Supabase Auth  

### Usuarios Objetivo

- **Administrador de Inventario**: Gestiona productos y existencias
- **Encargado de Facturación**: Procesa facturas de proveedores
- **Contador/Auditor**: Revisa transacciones sincronizadas con QBO

---

## 2. STACK TECNOLÓGICO

### Frontend
```
React 19.2.0          → Librería UI
Vite 7.2.4            → Bundler y dev server
Lucide-React 0.562    → Iconos SVG
PapaParse 5.5.3       → Parsing CSV
Tesseract.js 7.0.0    → OCR (para escaneo de documentos)
fast-xml-parser 5.3.4 → Parseo de XML
```

### Backend & Base de Datos
```
Supabase              → PostgreSQL + Auth + Edge Functions
Deno 1.x              → Runtime para Edge Functions
Node.js (opcional)    → Para local development
```

### Servicios Externos
```
QuickBooks Online     → Sistema contable cloud
Intuit OAuth 2.0      → Autenticación QBO
```

### Utilidades
```
ESLint 9.39.1         → Linter de código
```

---

## 3. ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)               │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Pages (Dashboard, Facturacion, InventarioPro)  │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │                                   │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │        Components (UI, Forms, Tables)           │    │
│  │  (Sidebar, Header, ReviewTable, Forms, etc)     │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │                                   │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │    Hooks (useFacturacion) & Services            │    │
│  │  (Lógica de negocio reutilizable)               │    │
│  └──────────────────┬──────────────────────────────┘    │
└─────────────────────┼──────────────────────────────────┘
                      │
      ┌───────────────┴───────────────┐
      │                               │
┌─────▼──────────────┐       ┌───────▼────────────────┐
│  Supabase Client   │       │  Servicios Externos    │
│  - Auth            │       │  - QuickBooks API      │
│  - Realtime DB     │       │  - OAuth Intuit        │
│  - Edge Functions  │       └────────────────────────┘
└─────┬──────────────┘
      │
┌─────▼──────────────────────────────────────────────────┐
│            BACKEND (Supabase + Deno)                   │
│  ┌────────────────────────────────────────────────┐    │
│  │  Edge Functions                                │    │
│  │  - qbo-oauth-handler    (OAuth flow)           │    │
│  │  - create-qbo-bill      (Create bills en QBO)  │    │
│  │  - get-qbo-accounts     (Fetch accounts)       │    │
│  │  - get-qbo-vendors      (Fetch vendors)        │    │
│  │  - auth-qbo             (Auth helper)          │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  PostgreSQL Database                           │    │
│  │  - usuarios                                    │    │
│  │  - productos                                   │    │
│  │  - qbo_tokens                                  │    │
│  │  - facturas_pendientes                         │    │
│  │  - politicas_comerciales                       │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

---

## 4. ESTRUCTURA DE CARPETAS

```
qbo-export-app/
├── src/
│   ├── App.jsx                          # Componente raíz - Gestiona sesión y sesión QBO
│   ├── main.jsx                         # Entry point
│   ├── pages/
│   │   ├── Dashboard.jsx                # Página de gestión de inventario
│   │   ├── Facturacion.jsx              # Página de procesamiento de facturas
│   │   └── InventarioPro.jsx            # (En desarrollo)
│   ├── components/
│   │   ├── Sidebar.jsx                  # Navegación lateral
│   │   ├── Header.jsx                   # Barra superior
│   │   ├── BulkScraper.jsx              # Carga CSV masive
│   │   ├── ReviewTable.jsx              # Tabla de productos
│   │   ├── ManualForm.jsx               # Formulario manual de productos
│   │   ├── SettingsManager.jsx          # Configuración de negocio
│   │   ├── InvoiceExtractor.jsx         # Extracción de datos de invoices
│   │   ├── Login/                       # Módulo de autenticación
│   │   │   ├── index.jsx
│   │   │   ├── LoginView.jsx
│   │   │   └── useLogin.js              # Hook para login
│   │   └── facturacion/                 # Componentes de facturación
│   │       ├── F_Header.jsx             # Header de facturación
│   │       ├── F_EmptyState.jsx         # Estado vacío
│   │       ├── F_ReviewTable.jsx        # Tabla de revisión de factura
│   │       ├── InboxDrawer.jsx          # Drawer con facturas pendientes
│   │       ├── InvoiceScraper.jsx       # (Scraper de invoices)
│   │       └── QBOConnector.jsx         # Conector QBO
│   ├── hooks/
│   │   └── useFacturacion.js            # Hook central de facturación
│   ├── services/
│   │   └── qboService.js                # Servicio para enviar bills a QBO
│   ├── utils/
│   │   ├── xmlParser.js                 # Parser de XML panameño
│   │   ├── qboMapper.js                 # Mapeo de datos a formato QBO
│   │   ├── scraperScript.js             # (Script de scraping)
│   └── styles/
│       ├── index.css
│       ├── btn.css                      # Estilos de botones
│       ├── form.css                     # Estilos de formularios
│       ├── Header.css
│       ├── BulkScraper.css
│       ├── ReviewTable.css
│       ├── Sidebar.css
│       └── Facturacion/
│           ├── facturacion.css
│           ├── F_ReviewTable.css
│           └── InboxDrawer.css
│   └── lib/
│       └── supabase.js                  # Configuración del cliente Supabase
├── supabase/
│   ├── config.toml                      # Configuración de Edge Functions
│   └── functions/
│       ├── qbo-oauth-handler/           # OAuth flow handler
│       ├── create-qbo-bill/             # Crear bill en QBO
│       ├── get-qbo-accounts/            # Traer cuentas QBO
│       ├── get-qbo-vendors/             # Traer proveedores QBO
│       └── auth-qbo/                    # Helper de autenticación
├── public/                              # Assets estáticos
├── index.html                           # HTML principal
├── vite.config.js                       # Configuración de Vite
├── eslint.config.js                     # Configuración de ESLint
├── package.json                         # Dependencias del proyecto
└── README.md                            # README básico
```

---

## 5. PÁGINAS PRINCIPALES

### 5.1 Dashboard (`src/pages/Dashboard.jsx`)

**Propósito**: Gestión completa del inventario de productos

**Props Recibidas**:
```javascript
{
  politicas: Array,        // Políticas comerciales desde BD
  cargarPoliticas: Function // Función para recargar políticas
}
```

**Estado Interno**:
```javascript
- productos: []             // Array de productos en memoria
```

**Funciones Clave**:

| Función | Descripción | Salida |
|---------|------------|--------|
| `cargarDesdeBD()` | Lee productos de la tabla `productos` en Supabase | Array de productos |
| `handleAddBatch(nuevos)` | Suma nuevos productos a la lista | State actualizado |
| `handleUpdate(id, field, value)` | Edita un campo de un producto | State actualizado |
| `handleDelete(id)` | Elimina un producto | State actualizado |
| `handleSincronizar()` | Valida y sincroniza con Supabase | Alerta de confirmación |
| `vaciarBandejaCompleta()` | Limpia toda la lista | State vacío |

**Componentes Hijo**:
- `Header` → Botón sincronizar
- `ReviewTable` → Tabla de productos
- `BulkScraper` → Carga CSV
- `ManualForm` → Agregar producto manual
- `SettingsManager` → Configuración
- `InvoiceExtractor` → Extracción de datos

**Validaciones**:
- SKU duplicados → Bloquea sincronización
- Campos requeridos → Mensaje de error
- Conexión BD → Retry automático

---

### 5.2 Facturación (`src/pages/Facturacion.jsx`)

**Propósito**: Procesar facturas XML y enviarlas a QuickBooks

**Estado Obtenido del Hook `useFacturacion`**:
```javascript
{
  invoiceData,           // Datos parseados de la factura
  isConnected,           // ¿Está conectado con QBO?
  realmId,               // ID de la empresa en QBO
  pendientes,            // Array de facturas pendientes
  qboAccounts,           // Cuentas disponibles en QBO
  qboVendors             // Proveedores en QBO
}
```

**Flujo Principal**:
1. Usuario carga archivo XML o selecciona de bandeja de entrada
2. XML se parsea con `useFacturacion.processNewInvoice()`
3. Se muestra tabla de revisión con campos editables
4. Usuario asigna cuentas a cada ítem
5. Click en "Enviar a QBO" ejecuta `enviarAQuickBooks()`
6. Bill se crea en QBO y estado se marca como "procesada"

**Componentes**:
- `F_Header` → Botones de conexión y refresh
- `F_EmptyState` → UI cuando no hay factura cargada
- `F_ReviewTable` → Tabla editable de items
- `InboxDrawer` → Selector de facturas pendientes

---

### 5.3 InventarioPro (`src/pages/InventarioPro.jsx`)

**Estado**: En desarrollo (estructura lista, lógica pendiente)

---

## 6. COMPONENTES DETALLADOS

### 6.1 Sidebar (`src/components/Sidebar.jsx`)

**Props**:
```javascript
{
  collapsed: Boolean,           // Estado colapsado
  onToggle: (Boolean) => void   // Callback al toggle
  currentView: String           // Vista actual
  onViewChange: (String) => void
}
```

**Funcionalidad**: Navegación entre Dashboard y Facturación

---

### 6.2 Header (`src/components/Header.jsx`)

**Props**:
```javascript
{
  onUpload: Function    // Callback sincronizar
}
```

**Botones**:
- 🔄 **Sincronizar** → Llama `onUpload` con validación
- 🚪 **Salir** → Logout via `supabase.auth.signOut()`

---

### 6.3 ReviewTable (`src/components/ReviewTable.jsx`)

**Props**:
```javascript
{
  productos: Array,           // Datos a mostrar
  onUpdate: Function,         // (id, field, value) => void
  onDelete: Function,         // (id) => void
}
```

**Características**:
- Tabla editable inline
- Columnas: SKU, Nombre, Precio Venta, Costo, Cantidad, Categoría
- Botones acción: Editar, Eliminar
- Responsive design

---

### 6.4 BulkScraper (`src/components/BulkScraper.jsx`)

**Funcionalidad**: Importa CSV de productos

**Formato esperado**:
```csv
sku,nombre,precio_venta,costo_compra,cantidad_existencia,categoria
001,Biblia,25.50,12.00,50,Libros
002,Himnario,15.00,7.50,100,Himnos
```

**Flujo**:
1. User selecciona archivo CSV
2. Parsea con PapaParse
3. Valida columnas
4. Llama `handleAddBatch()`

---

### 6.5 Login (`src/components/Login/index.jsx`)

**Funcionalidad**: Autenticación con Supabase

**Métodos de Login**:
- Email + Contraseña
- (Opcional: OAuth social)

**Gestión de Sesión**:
- Supabase maneja tokens automáticamente
- sessionStorage para persistencia en pestaña
- autoRefreshToken activo

---

### 6.6 F_ReviewTable (`src/components/facturacion/F_ReviewTable.jsx`)

**Props**:
```javascript
{
  data: Object,              // invoiceData parseado
  qboAccounts: Array,        // Cuentas disponibles
  qboVendors: Array,         // Proveedores QBO
  onUpdateItem: Function,    // (index, field, value) => void
  onSendToQBO: Function,     // () => void
  onClearTable: Function     // () => void
}
```

**Campos Editables por Ítem**:
- Descripción
- Cantidad
- Precio Unitario
- Impuesto (ITBMS)
- Account (selector dropdown)
- Total

**Validaciones**:
- Vendedor seleccionado
- Todas las cuentas asignadas
- Montos positivos

---

### 6.7 InboxDrawer (`src/components/facturacion/InboxDrawer.jsx`)

**Props**:
```javascript
{
  isOpen: Boolean,           // ¿Drawer visible?
  onClose: Function,         // () => void
  pendientes: Array,         // Facturas pendientes de BD
  onSelect: Function,        // (factura) => void
  onDelete: Function         // (id) => void
}
```

**Funcionalidad**:
- Lista todas las facturas con status = 'pendiente'
- Click para cargar en editor
- Botón eliminar
- Notificación con cantidad de pendientes

---

## 7. HOOKS PERSONALIZADOS

### 7.1 useFacturacion (`src/hooks/useFacturacion.js`)

**Propósito**: Central de lógica para el módulo de facturación

**Estado Manejado**:
```javascript
- invoiceData              // Factura actual parseada
- isConnected             // Status de conexión QBO
- realmId                 // ID de empresa en QBO
- pendientes              // Facturas de BD pendientes
- isDrawerOpen            // Drawer visible?
- qboAccounts             // Array de cuentas QBO
- qboVendors              // Array de proveedores QBO
```

**Funciones Exportadas**:

#### `syncQBO()`
**Sincroniza estado de conexión desde localStorage**
```javascript
// Se ejecuta en mount y cuando storage cambia
localStorage.getItem('qbo_connected') === 'true'
localStorage.getItem('qbo_realmId')
```

#### `fetchQboAccounts()`
**Obtiene lista de cuentas de QuickBooks**
```javascript
// Llama Edge Function 'get-qbo-accounts'
// Parámetros: realmId
// Retorna: { accounts: [...] }
// Almacena en state qboAccounts
```

#### `fetchQboVendors()`
**Obtiene lista de proveedores de QuickBooks**
```javascript
// Llama Edge Function 'get-qbo-vendors'
// Parámetros: realmId
// Retorna: { vendors: [...] }
// Almacena en state qboVendors
```

#### `fetchPendientes()`
**Obtiene facturas pendientes de la BD**
```javascript
// SELECT * FROM facturas_pendientes
// WHERE status = 'pendiente'
// ORDER BY fecha_recepcion DESC
```

**Realtime Updates**:
- Se suscribe a cambios en tabla `facturas_pendientes`
- Re-ejecuta query cuando hay cambios
- Retorna en estado `pendientes`

#### `processNewInvoice(xmlContent, dbId=null)`
**Parsea XML de factura electrónica panameña**

**Input**:
```javascript
xmlContent: String,    // XML completo
dbId: String|null      // ID de BD (si viene desde pendientes)
```

**Output**:
```javascript
{
  cufe: "ID-FACTURA",
  proveedor: "NOMBRE PROVEEDOR",
  ruc: "RUC-PROVIDER",
  fecha: "2026-01-28",
  total: 20.70,
  itbms: 0.62,
  vendorId: undefined,      // Usuario rellenará desde QBO
  items: [
    {
      descripcion: "Producto",
      cantidad: 1,
      precioUnitario: 20.08,
      totalOriginal: 20.08,
      taxSelected: false,
      valITBMS: 0,
      totalItem: 20.08,
      account: ""
    }
  ]
}
```

#### `handleUpdateItem(index, field, value)`
**Actualiza un campo de un ítem**

**Parámetros**:
```javascript
index: "header" | Number,  // "header" para campos de factura
field: "account"|"...",    // Campo a actualizar
value: any                 // Nuevo valor
```

**Lógica ITBMS**:
- Si `taxSelected = true`:
  - Calcula base = total / 1.07
  - ITBMS = total - base
- Si `taxSelected = false`:
  - ITBMS = 0
  - PrecioUnitario = total / cantidad

#### `enviarAQuickBooks()`
**Envía factura a QuickBooks y actualiza estado en BD**

**Validaciones Previas**:
- ✅ Vendor seleccionado
- ✅ Todas las cuentas asignadas
- ✅ Token válido en BD

**Acciones**:
1. Obtiene access_token de tabla `qbo_tokens`
2. Construye payload de Bill para QBO
3. Llama `sendBillToQBO()` (servicio)
4. Si éxito: Actualiza status a "procesada" en BD
5. Limpia estado local
6. Recarga bandeja de pendientes

**Manejo de Errores**:
- Token expirado → Pide reconexión
- Error validación QBO → Muestra detalle
- DB update fail → Log en consola

---

### 7.2 useLogin (`src/components/Login/useLogin.js`)

**Propósito**: Lógica de autenticación

**Funciones**:
- `login(email, password)` → Autentica usuario
- `signup(email, password)` → Crea cuenta nueva
- `logout()` → Cierra sesión

---

## 8. SERVICIOS

### 8.1 qboService (`src/services/qboService.js`)

**Función Principal**:
```javascript
sendBillToQBO(realmId, accessToken, billData)
```

**Parámetros**:
```javascript
realmId: String        // ID de empresa QB (ej: "1234567890")
accessToken: String    // Token OAuth de Intuit
billData: Object       // Payload Bill según QBO API v3
```

**Estructura del Bill**:
```javascript
{
  VendorRef: {
    value: "vendorId"
  },
  Line: [
    {
      Amount: 100.50,
      DetailType: "AccountBasedExpenseLineDetail",
      AccountBasedExpenseLineDetail: {
        AccountRef: { value: "accountId" }
      },
      Description: "Descripción del gasto"
    }
  ]
}
```

**Flujo Interno**:
1. Invoca Edge Function `create-qbo-bill`
2. Pasa realmId, token, bill
3. Edge Function maneja CORS
4. Respuesta: Objeto Bill creado en QBO o error

**Manejo de Errores**:
```javascript
// Si QBO retorna error
if (data.Fault) {
  throw new Error(`${data.Fault.Error[0].Message}: ${detail}`)
}
```

---

### 8.2 Supabase Client (`src/lib/supabase.js`)

**Inicialización**:
```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: window.sessionStorage,  // Sesión por pestaña
      persistSession: true,            // No cierra con F5
      autoRefreshToken: true           // Renueva automático
    }
  }
)
```

**Variables de Entorno Requeridas**:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

**Métodos Utilizados**:
- `supabase.auth.getSession()`
- `supabase.auth.signIn()`
- `supabase.auth.signOut()`
- `supabase.from(table).select()`
- `supabase.from(table).insert()`
- `supabase.from(table).upsert()`
- `supabase.from(table).update()`
- `supabase.from(table).delete()`
- `supabase.functions.invoke()`
- `supabase.channel().on().subscribe()`

---

## 9. BASE DE DATOS (SUPABASE)

### 9.1 Tablas Principales

#### Tabla: `usuarios`
```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre_completo VARCHAR(255),
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  activo BOOLEAN DEFAULT true
);
```

**Propósito**: Extender info del usuario de Supabase Auth  
**Relaciones**: Autenticación nativa de Supabase

---

#### Tabla: `productos`
```sql
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  precio_venta DECIMAL(10,2),
  costo_compra DECIMAL(10,2),
  cantidad_existencia INTEGER DEFAULT 0,
  categoria VARCHAR(100),
  punto_reorden INTEGER DEFAULT 0,
  fecha_inventario TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),
  usuario_id UUID REFERENCES usuarios(id)
);

CREATE INDEX idx_productos_sku ON productos(sku);
CREATE INDEX idx_productos_categoria ON productos(categoria);
```

**Propósito**: Catálogo centralizado de productos  
**Sincronización**: Desde Dashboard via `handleSincronizar()`  
**Validaciones**: SKU único, campos numéricos

---

#### Tabla: `qbo_tokens`
```sql
CREATE TABLE qbo_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  realm_id VARCHAR(50),
  expires_at TIMESTAMP,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)  -- Un token por usuario
);
```

**Propósito**: Almacenar credenciales OAuth de Intuit  
**Poblada Por**: Edge Function `qbo-oauth-handler`  
**Uso**: 
- `useFacturacion.enviarAQuickBooks()` obtiene token aquí
- Edge Functions consultan para autorizar llamadas a QBO API

---

#### Tabla: `facturas_pendientes`
```sql
CREATE TABLE facturas_pendientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  xml_content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pendiente',  -- pendiente | procesada | error
  fecha_recepcion TIMESTAMP DEFAULT NOW(),
  proveedor VARCHAR(255),
  total DECIMAL(10,2),
  cufe VARCHAR(100),  -- Clave única de factura
  metadata JSONB,     -- Datos adicionales parseados
  fecha_procesamiento TIMESTAMP,
  UNIQUE(cufe)  -- No duplicar mismo CUFE
);

CREATE INDEX idx_facturas_status ON facturas_pendientes(status);
CREATE INDEX idx_facturas_usuario ON facturas_pendientes(usuario_id);
```

**Propósito**: Bandeja de entrada de facturas  
**Populate**: 
- Manualmente cargadas en Facturación.jsx
- O vía formulario de carga
**Real-time Listening**: Hook `useFacturacion` se suscribe a cambios

---

#### Tabla: `politicas_comerciales`
```sql
CREATE TABLE politicas_comerciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES usuarios(id),
  nombre VARCHAR(255),
  descuento DECIMAL(4,2),  -- Porcentaje
  plazo_pago INTEGER,      -- Días
  fecha_vigencia TIMESTAMP,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Propósito**: Configuración de descuentos y términos  
**Uso**: Mostrada en Dashboard para referencia  
**Acceso**: `App.jsx` `cargarPoliticas()`

---

### 9.2 Seguridad & Políticas RLS

**Recomendación**: Implementar Row Level Security (RLS) en Supabase

```sql
-- Ejemplo para productos
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo sus productos"
ON productos FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios pueden insertar sus productos"
ON productos FOR INSERT
WITH CHECK (usuario_id = auth.uid());
```

---

## 10. EDGE FUNCTIONS (BACKEND)

Las Edge Functions corren en Supabase usando Deno. Manejadas en `/supabase/functions/`

### 10.1 qbo-oauth-handler

**Archivo**: `supabase/functions/qbo-oauth-handler/index.ts`

**Propósito**: Intercambiar código OAuth por token de Intuit

**Endpoint**: `supabase.functions.invoke('qbo-oauth-handler')`

**Request Body**:
```javascript
{
  code: String,      // Authorization code de Intuit
  realmId: String,   // ID de la empresa QB
  userId: String     // ID del usuario (de App.jsx)
}
```

**Flujo**:
1. Recibe `code` del callback de OAuth de Intuit
2. Envía POST a `oauth.platform.intuit.com/oauth2/v1/tokens/bearer`
3. Con Autenticación básica (clientId:clientSecret en base64)
4. Recibe: `access_token`, `refresh_token`, `expires_in`
5. Guarda en tabla `qbo_tokens`
6. Retorna éxito o error

**Credenciales Requeridas** (en Supabase env vars):
```
INTUIT_CLIENT_ID=ABK9ko4wbz4pMUSYqrcqqlHIKKeqXXlJ6AODNyy9Khl6X9td6V
INTUIT_CLIENT_SECRET=nAIFl0ICdoKrOPECt9sW6uXATxsjplOzuFq30r8O
```

**Error Handling**:
```
- 400: Code inválido o expirado
- 401: Credenciales incorrectas
- 500: Error al guardar en BD
```

---

### 10.2 create-qbo-bill

**Archivo**: `supabase/functions/create-qbo-bill/index.ts`

**Propósito**: Crear Bill (factura de gastos) en QuickBooks Online

**Endpoint**: `supabase.functions.invoke('create-qbo-bill')`

**Request Body**:
```javascript
{
  realmId: String,    // Company ID en QB
  token: String,      // Access token de OAuth
  bill: Object        // Objeto Bill según QBO API
}
```

**Ejemplo bill Object**:
```javascript
{
  VendorRef: { value: "1" },
  Line: [
    {
      Amount: 100.50,
      DetailType: "AccountBasedExpenseLineDetail",
      AccountBasedExpenseLineDetail: {
        AccountRef: { value: "2" }
      },
      Description: "Compra de inventario"
    }
  ]
}
```

**Flujo**:
1. Valida parámetros
2. Construye header con Bearer token
3. POST a `https://sandbox-quickbooks.api.intuit.com/v3/company/{realmId}/bill`
4. Retorna objeto Bill creado o error de QB

**Response**:
```javascript
{
  Id: "1",
  SyncToken: "0",
  MetaData: { CreateTime: "...", UpdateTime: "..." },
  ...
  // O
  Fault: {
    Error: [{
      Message: "Vendor not found",
      Detail: "..."
    }]
  }
}
```

---

### 10.3 get-qbo-accounts

**Propósito**: Listar todas las cuentas disponibles en QB

**Request Body**:
```javascript
{ realmId: String }
```

**Query**: `SELECT * FROM Account`

**Response**:
```javascript
{
  accounts: [
    {
      id: "1",
      name: "Cash",
      type: "Cash"
    },
    ...
  ]
}
```

---

### 10.4 get-qbo-vendors

**Propósito**: Listar todos los proveedores en QB

**Request Body**:
```javascript
{ realmId: String }
```

**Query**: `SELECT * FROM Vendor`

**Response**:
```javascript
{
  vendors: [
    {
      id: "1",
      name: "Proveedor A",
      email: "..."
    },
    ...
  ]
}
```

---

### 10.5 auth-qbo

**Estado**: Helper function para autenticación

---

## 11. FLUJOS DE DATOS

### 11.1 Flujo de Login

```
Usuario Ingresa Email/Password
         ↓
    Component Login.jsx
         ↓
supabase.auth.signInWithPassword()
         ↓
    Validar en Supabase Auth
         ↓
    ¿Autenticado?
    ├─ SÍ → setSession(user)
    │        App.jsx renderiza Dashboard
    │
    └─ NO → Error mensaje
```

---

### 11.2 Flujo de Conexión QuickBooks

```
User hace click "Conectar QB"
         ↓
Redirige a Intuit OAuth:
https://appcenter.intuit.com/connect/oauth2?
  client_id=XXX&
  response_type=code&
  scope=com.intuit.quickbooks.accounting&
  redirect_uri=http://localhost:5173/
         ↓
User autoriza en Intuit
         ↓
Intuit redirige: http://localhost:5173/?code=XXX&realmId=YYY
         ↓
App.jsx detecta params en useEffect
         ↓
Invoca: supabase.functions.invoke('qbo-oauth-handler', {
          body: { code, realmId, userId }
        })
         ↓
qbo-oauth-handler intercambia code por token
         ↓
Guarda en tabla qbo_tokens
         ↓
localStorage.setItem('qbo_connected', 'true')
localStorage.setItem('qbo_realmId', realmId)
         ↓
Limpia URL: window.history.replaceState()
         ↓
Recarga página: window.location.reload()
         ↓
useFacturacion sincroniza desde localStorage
         ↓
Fetch de accounts y vendors
         ↓
¡Listo para facturación!
```

---

### 11.3 Flujo de Procesamiento de Factura

```
User carga XML desde archivo o bandeja
         ↓
Facturacion.jsx → handleFileUpload()
         ↓
Lee contenido con FileReader
         ↓
Llama: useFacturacion.processNewInvoice(xmlContent)
         ↓
parseInvoiceXML() parsea con fast-xml-parser
         ↓
Extrae datos según estándar panameño:
    - CUFE, Proveedor, RUC, Fecha, Total, Items
         ↓
Normaliza items: { descripcion, cantidad, precioUnitario, totalItem }
         ↓
Agrega campos UI: { account, taxSelected, valITBMS, totalItem }
         ↓
setInvoiceData(parsed)
         ↓
F_ReviewTable renderiza tabla editable
         ↓
User:
  1. Selecciona Vendor (dropdown qboVendors)
  2. Por cada item, asigna Account (dropdown qboAccounts)
  3. (Opcional) Edita montos o impuestos
  4. Click "Enviar a QB"
         ↓
handleUpdateItem() actualiza fields
         ↓
Validación previa: Vendor + cuentas asignadas
         ↓
useFacturacion.enviarAQuickBooks()
         ↓
Obtiene access_token de tabla qbo_tokens
         ↓
Construye objeto Bill para QBO
         ↓
Invoca: sendBillToQBO(realmId, token, billPayload)
         ↓
create-qbo-bill Edge Function
         ↓
POST a QuickBooks API
         ↓
¿Éxito?
    ├─ SÍ → Bill creado en QB
    │        UPDATE facturas_pendientes SET status='procesada'
    │        Alert("Éxito")
    │        setInvoiceData(null)
    │        Recarga bandeja
    │
    └─ NO → Alert("Error: " + detalle)
```

---

### 11.4 Flujo de Sincronización de Productos

```
User carga CSV o ingresa productos manualmente
         ↓
Dashboard.jsx agrega a estado local: setProductos()
         ↓
ReviewTable renderiza tabla editable
         ↓
User hace ediciones (inline editing)
         ↓
Click "Sincronizar"
         ↓
Header.jsx → onUpload()
         ↓
Dashboard.jsx handleSincronizar()
         ↓
Validaciones:
  1. ¿Hay datos?
  2. ¿SKUs duplicados?
         ↓
Mapea productos a formato BD:
    {
      sku, nombre, precio_venta, costo_compra,
      cantidad_existencia, categoria, punto_reorden,
      fecha_inventario
    }
         ↓
Si es "solo_local": No incluye ID (INSERT nuevo)
Si tiene ID: Incluye para UPSERT (UPDATE existente)
         ↓
supabase.from('productos').upsert(data, { onConflict: 'sku' })
         ↓
¿Éxito?
    ├─ SÍ → Alert("Sincronización exitosa")
    │        Reload desde BD: cargarDesdeBD()
    │        Limpia estado "solo_local"
    │
    └─ NO → Alert("Error: " + detalles)
```

---

## 12. CONFIGURACIÓN INICIAL

### 12.1 Requisitos Previos

```
Node.js 18+
npm o yarn
Git
Cuenta Supabase
Cuenta Intuit Developer
Cuenta QuickBooks Online (Sandbox o Production)
```

---

### 12.2 Setup de Supabase

#### 1. Crear Proyecto Supabase

1. Ir a https://app.supabase.com
2. Click "New Project"
3. Nombre: `qbo-export-app`
4. Contraseña BD fuerte
5. Región: Seleccionar cercana
6. Copiar URL y anon key

#### 2. Crear Tablas

Ejecutar en SQL Editor de Supabase:

```sql
-- Tabla usuarios (extensión de auth.users)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre_completo VARCHAR(255),
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  activo BOOLEAN DEFAULT true
);

-- Tabla productos
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  precio_venta DECIMAL(10,2),
  costo_compra DECIMAL(10,2),
  cantidad_existencia INTEGER DEFAULT 0,
  categoria VARCHAR(100),
  punto_reorden INTEGER DEFAULT 0,
  fecha_inventario TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),
  usuario_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_productos_sku ON productos(sku);
CREATE INDEX idx_productos_categoria ON productos(categoria);

-- Tabla qbo_tokens
CREATE TABLE qbo_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  realm_id VARCHAR(50),
  expires_at TIMESTAMP,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla facturas_pendientes
CREATE TABLE facturas_pendientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  xml_content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pendiente',  -- pendiente | procesada | error
  fecha_recepcion TIMESTAMP DEFAULT NOW(),
  proveedor VARCHAR(255),
  total DECIMAL(10,2),
  cufe VARCHAR(100) UNIQUE,
  metadata JSONB,
  fecha_procesamiento TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_facturas_status ON facturas_pendientes(status);
CREATE INDEX idx_facturas_usuario ON facturas_pendientes(usuario_id);

-- Tabla politicas_comerciales
CREATE TABLE politicas_comerciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES usuarios(id),
  nombre VARCHAR(255),
  descuento DECIMAL(4,2),
  plazo_pago INTEGER,
  fecha_vigencia TIMESTAMP,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE qbo_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_pendientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE politicas_comerciales ENABLE ROW LEVEL SECURITY;
```

#### 3. Configurar RLS Policies

```sql
-- Política para productos
CREATE POLICY "Usuarios ven solo sus productos"
ON productos FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios pueden insertar sus productos"
ON productos FOR INSERT
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Usuarios pueden editar sus productos"
ON productos FOR UPDATE
USING (usuario_id = auth.uid());

-- Similar para facturas_pendientes, qbo_tokens, etc...
```

---

### 12.3 Setup Intuit Developer Account

1. Ir a https://app.developer.intuit.com
2. Sign up / Login
3. Crear nueva aplicación:
   - Nombre: "QBO Export App"
   - Tipo: Accounting
   - Usar Sandbox ambiente
4. En Settings → Keys & Credentials, copiar:
   - Client ID
   - Client Secret
5. En Settings → Redirect URIs, agregar:
   - `http://localhost:5173/`
   - `https://tudominio.com/` (para producción)

---

### 12.4 Variables de Entorno (.env.local)

Crear archivo en raíz del proyecto:

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Intuit (También necesitan estar en Supabase secrets)
VITE_INTUIT_CLIENT_ID=ABK9ko4wbz4pMUSYqrcqqlHIKKeqXXlJ6AODNyy9Khl6X9td6V

# Nota: CLIENT_SECRET no debe estar en .env público!
# Se configura solo en servidor/Edge Functions
```

---

### 12.5 Setup de Secrets en Supabase

En Supabase Dashboard → Project Settings → Secrets, agregar:

```
INTUIT_CLIENT_ID=ABK9ko4wbz4pMUSYqrcqqlHIKKeqXXlJ6AODNyy9Khl6X9td6V
INTUIT_CLIENT_SECRET=nAIFl0ICdoKrOPECt9sW6uXATxsjplOzuFq30r8O
```

Estos se acceden en Functions vía `Deno.env.get()`

---

### 12.6 Deploy de Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Desde carpeta del proyecto
supabase functions deploy qbo-oauth-handler
supabase functions deploy create-qbo-bill
supabase functions deploy get-qbo-accounts
supabase functions deploy get-qbo-vendors
```

---

## 13. GUÍA DE EJECUCIÓN

### 13.1 Instalación Local

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd qbo-export-app

# 2. Instalar dependencias
npm install

# 3. Crear .env.local con credenciales
cp .env.example .env.local
# Editar con valores reales

# 4. Iniciar servidor de desarrollo
npm run dev

# La app abre en http://localhost:5173/
```

---

### 13.2 Scripts Disponibles

```json
{
  "dev": "vite",              // Dev server con HMR
  "build": "vite build",      // Build production
  "lint": "eslint .",         // Check código
  "preview": "vite preview"   // Preview de build
}
```

---

### 13.3 First Run Checklist

- [ ] Supabase project creado y tablas pobladas
- [ ] Variables de entorno configuradas
- [ ] Edge Functions deployadas
- [ ] Intuit app configurada con redirect URI
- [ ] npm install ejecutado
- [ ] npm run dev iniciado sin errores
- [ ] Página Login carga sin 404
- [ ] Puedo registrar usuario nuevo
- [ ] Puedo loguearme
- [ ] Dashboard carga
- [ ] Puedo "Conectar QB" sin error CORS
- [ ] Redirección a Intuit funciona
- [ ] Callback retorna sin errores
- [ ] useFacturacion obtiene accounts y vendors

---

## 14. TROUBLESHOOTING

### Problema: CORS error al conectar QB

**Causa**: Redirect URI no coincide  
**Solución**:
1. Verificar en Intuit Dashboard el redirect URI registrado
2. Coincidir con el en App.jsx y .env.local
3. Si cambias, redeploy y limpia cache del navegador

---

### Problema: "Token not found" en facturación

**Causa**: qbo_tokens vacía o expirada  
**Solución**:
1. Conectar QB nuevamente
2. Verificar que qbo-oauth-handler guarde token correctamente
3. Revisar logs de Edge Function en Supabase

---

### Problema: XML no parsea correctamente

**Causa**: Formato XML diferente al esperado  
**Solución**:
1. Verificar estructura en xmlParser.js
2. Usar `console.log(jsonObj)` para inspeccionar
3. Puede ser versión diferente del estándar panameño

---

### Problema: Componentes no se renderizan

**Causa**: Import incorrecto  
**Solución**:
1. Revisar rutas en imports
2. Verificar que archivos existan
3. Ejecutar `npm run lint` para detectar errores

---

## 15. NOTAS PARA EL PRÓXIMO PROGRAMADOR

### 15.1 Arquitectura de Decisiones

**¿Por qué Supabase?**
- PostgreSQL real, no Firebase
- Edge Functions (Deno) para backend
- Auth integrado
- Real-time capabilities
- Mejor para producción

**¿Por qué Vite?**
- Build ultra-rápido
- HMR instantáneo
- Bundling óptimo
- Mejor alternativa a Create React App

**¿Por qué sessionStorage?**
- Usuario logout al cerrar pestaña
- Mayor seguridad en PCs compartidas
- configurar en lib/supabase.js si cambias

**¿Por qué XML parsing en cliente?**
- Evita servidor intermedio
- Más privacidad (no envía XML al servidor)
- Más rápido

---

### 15.2 Mejoras Futuras Sugeridas

1. **Refresh Token Rotation**
   - qbo_tokens.refresh_token expira
   - Implementar auto-refresh cuando access_token expire
   - Hook para refrescar antes de fallar

2. **Webhook para Facturas**
   - En lugar de cargar XML manualmente
   - Email → Supabase webhook → facturas_pendientes
   - Más auotmático

3. **OCR y Scraping**
   - Tesseract.js ya importado pero no usado
   - Podría escanear facturas en PDF/imagen
   - Extraer texto y parsear

4. **Sincronización Bidireccional**
   - Cuando QB cambia, reflejar en app
   - Real-time sync vía webhooks de Intuit

5. **Reportes y Dashboards**
   - Gráficos de inventario
   - Historial de facturas procesadas
   - KPIs de negocio

6. **Multi-tenancy**
   - Soportar múltiples empresas
   - Actualmente solo 1 QB per usuario
   - Agregar empresa_id en QBO tokens

7. **Auditoría**
   - Log de todas las acciones
   - Quién, cuándo, qué cambió
   - Para cumplimiento regulatorio

8. **Validaciones Fiscales**
   - Verificar CUFE válido
   - Validar RUC proveedor
   - Chequeo de fechas y montos

---

### 15.3 Seguridad - Checklist

- [ ] Nunca expongas SECRET_KEY en cliente
- [ ] RLS policies habilitadas en todas las tablas
- [ ] Validación de input en servidor (Edge Functions)
- [ ] HTTPS en producción
- [ ] CORS configurado restrictivo
- [ ] Rate limiting en Edge Functions
- [ ] Sanitize XML antes de parsear
- [ ] Audit logs para operaciones críticas
- [ ] Encriptar sensitive data en BD (RUC, RFC)

---

### 15.4 Testing

Considera agregar:
```bash
npm install --save-dev vitest @testing-library/react
```

Ejemplos de tests:
- Unit tests para xmlParser.js
- Component tests para ReviewTable
- Integration tests para flujo completo

---

### 15.5 Deployment

**Recomendaciones**:
1. **Frontend**: Vercel, Netlify o Supabase Hosting
2. **Variables**: Mostrar en panel CI/CD, no hardcodear
3. **Edge Functions**: Ya en Supabase, auto-deployed
4. **Base de Datos**: Backups automáticos Supabase
5. **Monitoreo**: Sentry para errores en cliente

---

### 15.6 Documentación Adicional Recomendada

- Crear doc de "API Endpoints" de Edge Functions
- Doc de "Schema DB" con ER diagram
- Guía de "Estándar de Código" (ESLint config)
- Runbook de "Producción" (deployment steps)
- Playbook de "Emergencias" (qué hacer si...)

---

### 15.7 Contactos y Recursos

**Recursos Útiles**:
- [Supabase Docs](https://supabase.com/docs)
- [Intuit QuickBooks API](https://developer.intuit.com/)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)

**Credenciales Críticas** (guardar seguro):
- Intuit Client ID / Secret
- Supabase User + Password
- API Keys de Supabase

---

## RESUMEN RÁPIDO

### Flujo de Login
1. Usuario escribe email/password
2. Supabase Auth valida
3. JWT guardado en sessionStorage
4. App renderiza Dashboard

### Flujo de Conexión QB
1. Click "Conectar QB"
2. Redirección OAuth a Intuit
3. Usuario autoriza
4. Callback con code + realmId
5. Edge Function intercambia por token
6. Token guardado en qbo_tokens table
7. localStorage marca como conectado

### Flujo de Procesamiento Factura
1. Carga XML → parseInvoiceXML() extrae datos
2. Muestra tabla editable
3. Usuario asigna vendor y cuentas
4. Click enviar → sendBillToQBO()
5. Create bill en QB
6. Marca como procesada en BD
7. ¡Listo!

### Flujo de Sincronización Inventario
1. Carga CSV o ingresa manual
2. Edita inline
3. Click Sincronizar
4. UPSERT a tabla productos
5. Recarga desde BD

---

**Última nota**: Este sistema está diseñado para ser escalable. Si necesitas agregar más usuarios, empresas, o integraciones, la arquitectura soporta. Solo asegúrate de implementar RLS correctamente y auditoría de cambios.

¡Te deseo éxito!

