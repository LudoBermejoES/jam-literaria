# Roadmap para la Aplicación de Jam Literaria

## PREVIO

Todos los comandos deberán ir con --yes o similar para que no se pida nada al usuario

## Fase 1: Configuración Inicial y Estructura del Proyecto

### 1.1 Configuración del Entorno de Desarrollo
- [ ] Instalar Node.js (versión LTS recomendada)
- [ ] Instalar Git para control de versiones
- [ ] Configurar un editor de código (VS Code recomendado)
- [ ] Configurar estructura de directorios según arquitectura:
  ```
  /
  ├── src/                    # Código fuente
  │   ├── routes/             # Rutas y controladores
  │   ├── middleware/         # Middleware Express
  │   ├── models/             # Modelos de datos
  │   ├── views/              # Plantillas EJS
  │   ├── public/             # Archivos estáticos
  │   ├── lib/                # Utilidades
  │   └── app.js              # Punto de entrada
  ├── tests/                  # Tests con Jest
  ├── database/               # Archivos de base de datos
  └── config/                 # Configuración
  ```
- [ ] Instalar extensiones recomendadas:
  - ESLint
  - Prettier
  - EJS Language Support

### 1.2 Inicialización del Proyecto
- [ ] Inicializar proyecto Node.js:
  ```bash
  npm init -y
  ```
- [ ] Instalar dependencias principales:
  ```bash
  npm install express ejs socket.io better-sqlite3 express-session uuid
  npm install --save-dev nodemon jest supertest
  ```
- [ ] Configurar ESLint y Prettier
- [ ] Configurar Nodemon para recarga en desarrollo
- [ ] Configurar scripts en package.json:
  ```json
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js",
    "test": "jest",
    "lint": "eslint ."
  }
  ```

### 1.3 Configuración de Base de Datos
- [ ] Crear directorio para base de datos
- [ ] Instalar better-sqlite3
- [ ] Crear esquema SQL inicial en database/schema.sql
- [ ] Implementar script de inicialización de base de datos
- [ ] Crear módulo de conexión en src/lib/db.js

### 1.4 Configuración de Testing
- [ ] Instalar Jest y SuperTest
- [ ] Configurar Jest para tests de servidor
- [ ] Crear archivo de configuración jest.config.js
- [ ] Preparar base de datos de prueba
- [ ] Crear helpers para tests

## Fase 2: Implementación de Funcionalidades Core

### 2.1 Sistema de Autenticación y Gestión de Usuarios
- [ ] Implementar modelo de Usuario en src/models/User.js
- [ ] Crear rutas de autenticación en src/routes/auth.js:
  - Registro de nombre de usuario
  - Validación de sesión
- [ ] Implementar middleware de autenticación en src/middleware/auth.js
- [ ] Crear vistas EJS para autenticación:
  - Formulario de ingreso de nombre
  - Pantalla de bienvenida
- [ ] Implementar tests unitarios en tests/unit/models/user.test.js
- [ ] Implementar tests de integración en tests/integration/routes/auth.test.js

### 2.2 Sistema de Sesiones
- [ ] Implementar modelo de Sesión en src/models/Session.js
- [ ] Crear rutas de sesión en src/routes/session.js:
  - Creación de sesión
  - Unión a sesión existente
  - Obtención de estado de sesión
- [ ] Implementar generación de códigos únicos en src/lib/utils.js
- [ ] Crear vistas EJS para sesiones:
  - Pantalla de creación de sesión
  - Pantalla de unión a sesión 
  - Pantalla de espera
- [ ] Implementar tests para gestión de sesiones

### 2.3 Sistema de Ideas
- [ ] Implementar modelo de Idea en src/models/Idea.js
- [ ] Crear rutas para ideas en src/routes/ideas.js:
  - Envío de ideas
  - Obtención de ideas por sesión
- [ ] Implementar validaciones para ideas:
  - Número de ideas según participantes
  - Longitud de ideas
- [ ] Crear vistas EJS para ideas:
  - Formulario de envío de ideas
  - Lista de ideas
- [ ] Implementar tests para sistema de ideas

### 2.4 Sistema de Votación
- [ ] Implementar modelo de Voto en src/models/Vote.js
- [ ] Crear rutas para votación en src/routes/voting.js:
  - Envío de votos
  - Procesamiento de votos
  - Obtención de resultados
- [ ] Implementar lógica de selección de ideas en src/lib/voting.js:
  - Algoritmo de desempate
  - Gestión de rondas
- [ ] Crear vistas EJS para votación:
  - Pantalla de votación
  - Visualización de resultados
- [ ] Implementar tests para sistema de votación

## Fase 3: Implementación de Comunicación en Tiempo Real

### 3.1 Configuración de Socket.io
- [ ] Configurar Socket.io con Express en src/lib/socket.js
- [ ] Integrar Socket.io en la aplicación principal

### 3.2 Eventos en Tiempo Real
- [ ] Implementar eventos para:
  - Unión a sesión
  - Envío de ideas
  - Votación
  - Resultados
- [ ] Implementar manejo de reconexiones y errores de red
- [ ] Crear código cliente para Socket.io en src/public/js/
- [ ] Integrar Socket.io en las vistas EJS
- [ ] Implementar tests para comunicación en tiempo real

## Fase 4: Desarrollo de UI/UX

### 4.1 Diseño Base
- [ ] Crear sistema de diseño básico en CSS
- [ ] Crear archivos CSS para componentes principales
- [ ] Implementar diseño responsive
- [ ] Crear layouts y partials EJS reutilizables

### 4.2 Componentes Principales
- [ ] Implementar componentes EJS:
  - Header y Footer (partials)
  - Formularios
  - Botones
  - Tarjetas
  - Mensajes de error/éxito
- [ ] Crear archivos CSS correspondientes
- [ ] Desarrollar JavaScript cliente para interactividad
- [ ] Probar componentes en diferentes navegadores

### 4.3 Pantallas Principales
- [ ] Implementar todas las vistas EJS:
  - Introducción
  - Creación/Unión a sesión
  - Envío de ideas
  - Votación
  - Resultados
- [ ] Asegurar navegación coherente entre vistas
- [ ] Implementar manejo de errores en cada vista
- [ ] Asegurar adaptación a diferentes dispositivos

## Fase 5: Optimización y Testing

### 5.1 Optimización de Rendimiento
- [ ] Optimizar consultas SQL
- [ ] Implementar cache básico donde sea apropiado
- [ ] Minificar y comprimir assets (CSS, JS)
- [ ] Implementar carga diferida de scripts no esenciales
- [ ] Optimizar tamaño de imágenes

### 5.2 Testing Completo
- [ ] Completar tests unitarios para todos los modelos
- [ ] Completar tests de integración para todas las rutas
- [ ] Implementar tests end-to-end para flujos completos
- [ ] Verificar cobertura de tests

### 5.3 Optimización Mobile
- [ ] Verificar responsive design en múltiples dispositivos
- [ ] Optimizar experiencia táctil
- [ ] Mejorar tiempos de carga en conexiones lentas
- [ ] Probar en diferentes navegadores móviles

## Fase 6: Despliegue y Documentación

### 6.1 Preparación para Producción
- [ ] Configurar variables de entorno
- [ ] Implementar logging apropiado
- [ ] Configurar manejo de errores para producción
- [ ] Crear script de inicialización de base de datos para producción

### 6.2 Documentación
- [ ] Crear documentación técnica
- [ ] Documentar API y puntos de integración
- [ ] Crear guía de usuario
- [ ] Documentar proceso de instalación y configuración

### 6.3 Despliegue
- [ ] Elegir plataforma de hosting
- [ ] Configurar dominio
- [ ] Implementar SSL
- [ ] Realizar despliegue inicial

## Fase 7: Mantenimiento y Mejoras

### 7.1 Monitoreo
- [ ] Implementar sistema de logging
- [ ] Configurar monitoreo de errores
- [ ] Implementar analytics básicos
- [ ] Crear dashboard de monitoreo simple

### 7.2 Mejoras Continuas
- [ ] Recolectar feedback de usuarios
- [ ] Implementar mejoras de UI/UX basadas en feedback
- [ ] Optimizar rendimiento según métricas
- [ ] Mantener dependencias actualizadas

## Fase 8: Implementación del Algoritmo de Votación

### 8.1 Implementación Completa del Algoritmo
- [ ] Desarrollar la función determinarAccionSiguiente() en src/lib/voting.js
- [ ] Implementar la función agruparIdeasPorVotos()
- [ ] Crear función prepararNuevaRonda() para manejo de desempates
- [ ] Desarrollar función finalizarSeleccion() para finalizar el proceso

### 8.2 Testing Exhaustivo de Casos de Votación
- [ ] Implementar tests para todos los escenarios de votación:
  - [ ] T01: 3 ideas con mismo número de votos (empatadas)
  - [ ] T02: 2 ideas con más votos, 1 idea en segunda posición
  - [ ] T03: 2 ideas con más votos, múltiples empatadas en segunda posición
  - [ ] T04: 1 idea con más votos, 2 empatadas en segunda posición
  - [ ] T05: 1 idea con más votos, 1 en segunda, 1 en tercera
  - [ ] T06: 1 idea con más votos, 1 en segunda, múltiples en tercera
  - [ ] T07: 1 idea con más votos, múltiples (>2) en segunda
  - [ ] T08: Más de 3 ideas empatadas con mayor número de votos
  - [ ] T09: Segunda ronda con ideas previamente elegidas
  - [ ] T10: Tercera ronda para desempate final

### 8.3 Integración con Socket.io para Notificaciones
- [ ] Implementar eventos para notificar nueva ronda de votación
- [ ] Crear eventos para comunicar resultados finales
- [ ] Desarrollar sistema para sincronizar estado de votación entre usuarios
- [ ] Manejar reconexiones durante el proceso de votación

## Fase 9: Accesibilidad e Internacionalización

### 9.1 Implementación de Accesibilidad
- [ ] Auditar la aplicación con herramientas de accesibilidad
- [ ] Implementar atributos ARIA apropiados
- [ ] Asegurar navegación por teclado
- [ ] Verificar contraste de colores
- [ ] Probar con lectores de pantalla

### 9.2 Internacionalización (opcional)
- [ ] Extraer todos los textos a archivos independientes
- [ ] Implementar un sistema simple de cambio de idioma
- [ ] Adaptar vistas para manejar diferentes longitudes de texto
- [ ] Probar la aplicación en diferentes idiomas

## Timeline Estimado

### Fase 1: 1 semana
- Configuración inicial
- Estructura del proyecto
- Base de datos

### Fase 2: 2 semanas
- Autenticación
- Sesiones
- Ideas
- Votación

### Fase 3: 1 semana
- Socket.io
- Tiempo real
- Sincronización

### Fase 4: 1 semana
- UI/UX
- Componentes
- Pantallas

### Fase 5: 1 semana
- Optimización
- Testing
- Mobile

### Fase 6: 1 semana
- Producción
- Documentación
- Despliegue

### Fase 7-9: 2 semanas
- Algoritmo de votación
- Accesibilidad
- Mejoras finales

Total estimado: 9 semanas para versión completa 