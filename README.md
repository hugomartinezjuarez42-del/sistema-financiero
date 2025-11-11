# Sistema de Gestión de Préstamos

Sistema completo para gestionar préstamos, clientes, pagos y cobranza.

## 🚀 Despliegue Rápido (5 minutos)

### Paso 1: Crear cuenta en GitHub
1. Ve a https://github.com/signup
2. Crea tu cuenta gratuita

### Paso 2: Crear repositorio
1. Click en el botón **"+"** (arriba derecha) → **"New repository"**
2. Nombre: `sistema-prestamos` (o el que prefieras)
3. Selecciona **"Public"** o **"Private"**
4. **NO marques** "Add README"
5. Click en **"Create repository"**

### Paso 3: Subir el código
Copia estos comandos desde tu terminal (en la carpeta del proyecto):

```bash
git remote add origin https://github.com/TU_USUARIO/sistema-prestamos.git
git branch -M main
git push -u origin main
```

Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

### Paso 4: Conectar con Vercel
1. Ve a https://vercel.com/signup
2. Click en **"Continue with GitHub"**
3. Autoriza a Vercel
4. Click en **"Import Project"**
5. Selecciona tu repositorio `sistema-prestamos`
6. Click en **"Import"**

### Paso 5: Agregar Variables de Entorno
1. En Vercel, ve a **Settings** → **Environment Variables**
2. Agrega estas dos variables:

```
VITE_SUPABASE_URL = https://jshghivskujmqgbbdkil.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaGdoaXZza3VqbXFnYmJka2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODg1NzEsImV4cCI6MjA3NjY2NDU3MX0.MUeHPSP9yov4kTQyexyJErH_jbviV6i1-7pKL6Ak_ts
```

3. Click en **"Save"**
4. Vercel desplegará automáticamente

### ✅ ¡Listo!

Vercel te dará un enlace como: `https://sistema-prestamos.vercel.app`

Ese enlace es público y todos tus colaboradores podrán usarlo.

---

## 🔄 Actualizar el Sitio

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Descripción de cambios"
git push
```

Vercel detectará los cambios y actualizará automáticamente.

---

## 📋 Funcionalidades

- ✅ Gestión de clientes
- ✅ Préstamos y pagos
- ✅ Seguimiento de cobranza
- ✅ Reportes financieros
- ✅ Sistema de documentos
- ✅ Garantías y colaterales
- ✅ Recordatorios WhatsApp
- ✅ Análisis de rentabilidad
- ✅ Multi-usuario con roles

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa que las variables de entorno estén correctas
2. Verifica en la consola de Vercel si hay errores
3. Asegúrate de que tu base de datos Supabase esté activa
