# Jam Literaria

Aplicación para gestionar sesiones colaborativas de jam literaria.

## Estructura del proyecto

- `app/`: Frontend en React con TypeScript
- `server/`: Backend en Node.js con Express y TypeScript
- `docs/`: Documentación del proyecto

## Requisitos

- Node.js (v18.x o superior)
- npm (v8.x o superior)

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/usuario/jam.git
cd jam
```

2. Instalar dependencias (cliente y servidor):

```bash
npm install
```

Este comando instalará automáticamente las dependencias tanto para el cliente como para el servidor.

## Configuración

### Variables de entorno

1. Crear archivos `.env` para el cliente:

```bash
cp app/.env.example app/.env
```

2. Crear archivos `.env` para el servidor:

```bash
cp server/.env.example server/.env
```

3. Ajustar las variables de entorno según el entorno de desarrollo o producción.

## Desarrollo

Para ejecutar la aplicación en modo desarrollo:

```bash
npm run dev
```

Este comando inicia tanto el servidor como el cliente en modo desarrollo, con recarga automática.

Para ejecutar solo el cliente:

```bash
npm run dev:client
```

Para ejecutar solo el servidor:

```bash
npm run dev:server
```

## Pruebas

Para ejecutar todas las pruebas:

```bash
npm test
```

Para ejecutar solo las pruebas del cliente:

```bash
npm run test:client
```

Para ejecutar solo las pruebas del servidor:

```bash
npm run test:server
```

## Construcción para producción

Para construir tanto el cliente como el servidor para producción:

```bash
npm run build
```

## Ejecución en producción

Para ejecutar la aplicación en modo producción:

```bash
npm run start:prod
```

Esto construirá la aplicación y la ejecutará en modo producción.

### Nota sobre WSL y Windows

Si estás ejecutando la aplicación en WSL, puede haber problemas de permisos al generar los binarios de Prisma. En este caso, se recomienda:

1. Usar Node.js nativo en Windows en lugar de WSL
2. O ejecutar la aplicación completamente dentro de WSL (sin acceder a archivos desde Windows)

## Base de datos

La aplicación utiliza SQLite a través de Prisma para desarrollo, pero se puede configurar para usar otras bases de datos en producción.

Para inicializar la base de datos:

```bash
cd server
npx prisma migrate dev
```

### Configuración para producción

Para configurar la base de datos en producción, se recomienda usar PostgreSQL. Ejecuta el script:

```bash
cd server
node prisma/prisma-production.js
```

Esto generará un archivo `schema.production.prisma` configurado para PostgreSQL.

## Características principales

- Autenticación simple con nombre de usuario
- Creación y unión a sesiones de colaboración en tiempo real
- Envío y votación de ideas literarias
- Selección colaborativa de las mejores ideas

## Estructura del código

- Client (React)
  - `app/src/components`: Componentes de UI
  - `app/src/hooks`: Hooks personalizados (autenticación, sesiones, etc.)
  - `app/src/services`: Servicios (API, Socket.io)
  - `app/src/utils`: Utilidades y funciones auxiliares

- Server (Node.js)
  - `server/routes`: Rutas API REST
  - `server/middleware`: Middleware de Express
  - `server/prisma`: Esquemas y migraciones de Prisma
  - `server/types`: Tipos y definiciones TypeScript

## Estructura del Proyecto

```
/
├── app/           # Cliente React
├── server/        # Servidor Node.js
├── prisma/        # Configuración y modelos de Prisma
├── public/        # Archivos estáticos
├── __tests__/     # Tests
└── .vscode/       # Configuración de VS Code
```

## Extensiones recomendadas para VS Code

- ESLint
- Prettier
- TypeScript
- Tailwind CSS IntelliSense 