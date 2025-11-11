# 🚀 Guía de Instalación - Sistema de Gestión de Préstamos

## Método Recomendado: Clonar desde Git

Si el proyecto está en Git, simplemente:

```bash
git clone [url-del-repositorio]
cd sistema-prestamos
npm install
```

## Método Manual: Crear desde Cero

### 1. Crear Proyecto Base

```bash
npm create vite@latest sistema-prestamos -- --template react-ts
cd sistema-prestamos
```

### 2. Instalar Todas las Dependencias

```bash
# Dependencias principales
npm install @supabase/supabase-js@^2.57.4
npm install chart.js@^4.5.1 react-chartjs-2@^5.3.1
npm install html2canvas@^1.4.1 jspdf@^3.0.3 jspdf-autotable@^5.0.2
npm install lucide-react@^0.344.0

# Dependencias de desarrollo
npm install -D tailwindcss@^3.4.1 postcss@^8.4.35 autoprefixer@^10.4.18
npm install -D vite-plugin-pwa@^1.1.0

# Inicializar Tailwind
npx tailwindcss init -p
```

### 3. Configurar Tailwind CSS

**Archivo: `tailwind.config.js`**

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Archivo: `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Configurar Vite PWA

**Archivo: `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sistema de Préstamos',
        short_name: 'Préstamos',
        description: 'Sistema de gestión de préstamos y clientes',
        theme_color: '#ffffff',
      }
    })
  ],
})
```

### 5. Configurar Variables de Entorno

**Archivo: `.env`**

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica-anonima
```

**🔑 Para obtener tus credenciales:**

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 6. Configurar Base de Datos en Supabase

1. Ve a tu Dashboard de Supabase
2. Abre el **SQL Editor**
3. Ejecuta las migraciones en orden (ver carpeta `supabase/migrations/`)

O ejecuta este comando si tienes Supabase CLI:

```bash
npx supabase db push
```

### 7. Copiar Archivos del Proyecto

Necesitas copiar estos archivos/carpetas:

```
proyecto/
├── src/
│   ├── App.tsx                    ← Aplicación principal
│   ├── main.tsx                   ← Punto de entrada
│   ├── index.css                  ← Estilos globales
│   ├── components/                ← Todos los componentes (32 archivos)
│   ├── hooks/                     ← Custom hooks
│   ├── lib/                       ← Configuración de Supabase
│   └── utils/                     ← Utilidades
├── supabase/
│   └── migrations/                ← Migraciones SQL
├── public/                        ← Recursos públicos
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### 8. Ejecutar el Proyecto

```bash
# Modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

## 📦 Despliegue a Producción

### Opción 1: Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

### Opción 2: Netlify

```bash
npm install -g netlify-cli
netlify deploy
```

### Opción 3: Supabase Hosting

```bash
npm run build
# Sube la carpeta dist/ a tu hosting preferido
```

## 🔧 Configuración de Supabase

### Habilitar Autenticación

1. Dashboard → **Authentication** → **Providers**
2. Habilita **Email**
3. Configura las URLs de redirección si es necesario

### Configurar Storage

1. Dashboard → **Storage**
2. Crear buckets (se crean automáticamente con las migraciones):
   - `receipts` (público)
   - `documents` (privado)
   - `collateral-photos` (privado)

### Políticas de Seguridad (RLS)

Las políticas ya están incluidas en las migraciones. Verifica que:
- RLS esté habilitado en todas las tablas
- Las políticas restrinjan acceso solo a usuarios autenticados
- Cada usuario solo ve sus propios datos

## 🎯 Verificar Instalación

1. **Login**: Debe permitir registro e inicio de sesión
2. **Crear cliente**: Prueba crear un cliente nuevo
3. **Crear préstamo**: Agrega un préstamo al cliente
4. **Agregar pago**: Registra un pago
5. **Ver Dashboard**: Debe mostrar gráficos
6. **Generar PDF**: Prueba estados de cuenta y contratos
7. **Modo oscuro**: Toggle debe funcionar
8. **Análisis**: Revisa rentabilidad y comparativas

## 🆘 Solución de Problemas

### Error: "Cannot connect to Supabase"
- Verifica las variables de entorno en `.env`
- Confirma que el proyecto de Supabase esté activo

### Error: "Table does not exist"
- Ejecuta todas las migraciones en orden
- Verifica en Supabase Dashboard que las tablas existan

### Error de compilación TypeScript
- Ejecuta `npm install` nuevamente
- Verifica que todas las dependencias estén instaladas

### Charts no se muestran
- Verifica que Chart.js esté registrado correctamente
- Ya está arreglado en `FinancialDashboard.tsx`

## 📚 Documentación Adicional

- **FUNCIONALIDADES.md**: Lista completa de funcionalidades
- **SOPORTE.md**: Información de contacto y soporte
- Documentación de Supabase: https://supabase.com/docs
- Documentación de Vite: https://vitejs.dev/

## 🎉 ¡Listo!

Tu sistema de gestión de préstamos está ahora funcionando localmente.

**Próximos pasos sugeridos:**
1. Personaliza el nombre y colores
2. Agrega tu logo
3. Configura backups automáticos
4. Implementa notificaciones
5. Despliega a producción
