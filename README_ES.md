# Blackbox Chat

Una aplicación de mensajería en tiempo real centrada en la privacidad, construida con **Next.js**, **Supabase** y **Tailwind CSS**.

## 🚀 Características

- **Mensajería Privada Uno a Uno**: Chat en tiempo real impulsado por Supabase Postgres Changes.
- **Soporte de Medios Enriquecidos**: Envía texto, imágenes y stickers sin esfuerzo.
- **Privacidad Primero (App Lock)**: La interfaz se desenfoca automáticamente cuando la ventana pierde el foco para ocultar contenido sensible.
- **Autenticación Personalizada**: Gestión segura de credenciales usando hashing Bcrypt dentro de Supabase.
- **UI Optimista**: Experimenta mensajería con latencia cero mediante actualizaciones de estado locales.
- **Diseño Responsivo**: Estética premium con modo oscuro y transiciones suaves.

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend**: [Supabase](https://supabase.com/) (Auth, Realtime, DB, Storage)
- **Iconos**: [React Feather](https://feathericons.com/)

## 📂 Estructura del Proyecto

- `/app`: Páginas de Next.js y rutas de API.
- `/components`: Componentes de UI reutilizables (ChatInput, ChatMessage, AppLock).
- `/lib`: Cliente de Supabase y configuraciones del lado del servidor.
- `/hooks`: Hooks personalizados de React para autenticación y sincronización en tiempo real.
- `/db`: Esquema SQL para perfiles y mensajes.
- `/scripts`: Scripts de utilidad para comprobaciones de entorno y creación de usuarios de prueba.

## ⚙️ Instrucciones de Configuración

### 1. Prerrequisitos
- Node.js instalado.
- Un proyecto en Supabase.

### 2. Configuración del Entorno
Copia `.env.example` a `.env.local` y rellena tus credenciales de Supabase:
```bash
NEXT_PUBLIC_SUPABASE_URL=tu-url-del-proyecto
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3. Inicialización de la Base de Datos
Ejecuta el SQL que se encuentra en `db/schema.sql` en tu Editor SQL de Supabase. Esto permitirá:
- Crear las tablas `profiles` y `messages`.
- Configurar políticas de seguridad (RLS).
- Habilitar la replicación en tiempo Real.
- Crear funciones de ayuda de autenticación seguras.

### 4. Instalación y Desarrollo Local
```bash
npm install
npm run dev
```

### 5. Crear Usuarios de Prueba
Ejecuta el siguiente comando para inicializar los usuarios por defecto (`alice`, `bob`, `admin`):
```bash
npm run create-test-users
```

## 🔒 Seguridad
La aplicación utiliza **Row Level Security (RLS)** para asegurar que los usuarios solo puedan acceder a sus propios mensajes. La autenticación se gestiona en el lado del servidor con gestión de cookies segura.

## 📄 Licencia
Este proyecto está bajo la Licencia ISC.
