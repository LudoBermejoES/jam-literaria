# Roadmap para la Aplicación de Jam Literaria

## PREVIO

Todos los comandos deberán ir con --yes o similar para que no se pida nada al usuario

## Fase 1: Configuración Inicial y Estructura del Proyecto

### 1.1 Configuración del Entorno de Desarrollo
- [x] Instalar Node.js (versión LTS recomendada)
- [x] Instalar Git para control de versiones
- [x] Configurar un editor de código (VS Code recomendado)
- [x] Configurar estructura de directorios según arquitectura:
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
- [x] Instalar extensiones recomendadas:
  - ESLint
  - Prettier
  - EJS Language Support

### 1.2 Inicialización del Proyecto
- [x] Inicializar proyecto Node.js:
  ```bash
  npm init -y
  ```
- [x] Instalar dependencias principales:
  ```bash
  npm install express ejs socket.io express-session uuid
  npm install --save-dev nodemon jest supertest
  ```
- [x] Configurar ESLint y Prettier
- [x] Configurar Nodemon para recarga en desarrollo
- [x] Configurar scripts en package.json:
  ```json
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js",
    "test": "jest",
    "lint": "eslint ."
  }
  ```

### 1.3 Configuración de Base de Datos
- [x] Crear directorio para base de datos
- [x] Implementar conexión a SQLite usando el módulo nativo de Node.js
- [x] Crear esquema SQL inicial en database/schema.sql
- [x] Implementar script de inicialización de base de datos
- [x] Crear módulo de conexión en src/lib/db.js

### 1.4 Configuración de Testing
- [x] Instalar Jest y SuperTest
- [x] Configurar Jest para tests de servidor
- [x] Crear archivo de configuración jest.config.js
- [x] Preparar base de datos de prueba
- [x] Crear helpers para tests

## Fase 2: Implementación de Funcionalidades Core

### 2.1 Sistema de Autenticación y Gestión de Usuarios
- [x] Implementar modelo de Usuario en src/models/User.js
- [x] Crear rutas de autenticación en src/routes/auth.js:
  - Registro de nombre de usuario
  - Validación de sesión
- [x] Implementar middleware de autenticación en src/middleware/auth.js
- [x] Crear vistas EJS para autenticación:
  - Formulario de ingreso de nombre
  - Pantalla de bienvenida
- [x] Implementar tests unitarios en tests/unit/models/user.test.js
- [x] Implementar tests de integración en tests/integration/routes/auth.test.js

### 2.2 Sistema de Sesiones
- [x] Implementar modelo de Sesión en src/models/Session.js
- [x] Crear rutas de sesión en src/routes/session.js:
  - Creación de sesión
  - Unión a sesión existente
  - Obtención de estado de sesión
- [x] Implementar generación de códigos únicos en src/lib/utils.js
- [x] Crear vistas EJS para sesiones:
  - Pantalla de creación de sesión
  - Pantalla de unión a sesión 
  - Pantalla de espera
- [x] Implementar tests para gestión de sesiones

### 2.3 Sistema de Ideas
- [x] Implementar modelo de Idea en src/models/Idea.js
- [x] Crear rutas para ideas en src/routes/ideas.js:
  - Envío de ideas
  - Obtención de ideas por sesión
- [x] Implementar validaciones para ideas:
  - Número de ideas según participantes
  - Longitud de ideas
- [x] Crear vistas EJS para ideas:
  - Formulario de envío de ideas
  - Lista de ideas
- [x] Implementar tests para sistema de ideas

### 2.4 Sistema de Votación
- [x] Implementar modelo de Voto en src/models/Vote.js
- [x] Crear rutas para votación en src/routes/voting.js:
  - Envío de votos
  - Procesamiento de votos
  - Obtención de resultados
- [x] Implementar lógica de selección de ideas en src/lib/voting.js:
  - Algoritmo de desempate
  - Gestión de rondas
- [x] Crear vistas EJS para votación:
  - Pantalla de votación
  - Visualización de resultados
- [x] Implementar tests para sistema de votación

## Fase 3: Implementación de Comunicación en Tiempo Real

### 3.1 Configuración de Socket.io (Sustituido por Sistema de Polling)
- [x] ~~Configurar Socket.io con Express en src/lib/socket.js~~ Implementado sistema de polling HTTP para actualizaciones en tiempo real
- [x] ~~Integrar Socket.io en la aplicación principal~~ Integración del sistema de polling en el cliente y servidor

### 3.2 Eventos en Tiempo Real
- [x] Implementar eventos para:
  - Unión a sesión
  - Envío de ideas
  - Votación
  - Resultados
- [x] Implementar manejo de reconexiones y errores de red
- [x] Crear código cliente para ~~Socket.io~~ polling en src/public/js/
- [x] Integrar notificaciones en tiempo real en las vistas EJS
- [x] Implementar tests para comunicación en tiempo real

## Fase 4: Desarrollo de UI/UX

### 4.1 Diseño Base
- [x] Crear sistema de diseño básico en CSS
- [x] Crear archivos CSS para componentes principales
- [x] Implementar diseño responsive
- [x] Crear layouts y partials EJS reutilizables

### 4.2 Componentes Principales
- [x] Implementar componentes EJS:
  - Header y Footer (partials)
  - Formularios
  - Botones
  - Tarjetas
  - Mensajes de error/éxito
- [x] Crear archivos CSS correspondientes
- [x] Desarrollar JavaScript cliente para interactividad
- [x] Probar componentes en diferentes navegadores

### 4.3 Pantallas Principales
- [x] Implementar todas las vistas EJS:
  - Introducción
  - Creación/Unión a sesión
  - Envío de ideas
  - Votación
  - Resultados
- [x] Asegurar navegación coherente entre vistas
- [x] Implementar manejo de errores en cada vista
- [x] Asegurar adaptación a diferentes dispositivos

## Fase 5: Optimización y Testing

### 5.1 Optimización de Rendimiento
- [x] Optimizar consultas SQL
- [x] Implementar cache básico donde sea apropiado
- [ ] Minificar y comprimir assets (CSS, JS)
- [ ] Implementar carga diferida de scripts no esenciales
- [ ] Optimizar tamaño de imágenes

### 5.2 Testing Completo
- [x] Completar tests unitarios para todos los modelos
- [x] Completar tests de integración para todas las rutas
- [ ] Implementar tests end-to-end para flujos completos
- [ ] Verificar cobertura de tests

### 5.3 Optimización Mobile
- [x] Verificar responsive design en múltiples dispositivos
- [x] Optimizar experiencia táctil
- [ ] Mejorar tiempos de carga en conexiones lentas
- [ ] Probar en diferentes navegadores móviles

## Fase 6: Despliegue y Documentación

### 6.1 Preparación para Producción
- [x] Configurar variables de entorno
- [x] Implementar logging apropiado
- [x] Configurar manejo de errores para producción
- [x] Crear script de inicialización de base de datos para producción

### 6.2 Documentación
- [x] Crear documentación técnica
- [x] Documentar API y puntos de integración
- [x] Crear guía de usuario
- [ ] Documentar proceso de instalación y configuración

### 6.3 Despliegue
- [ ] Elegir plataforma de hosting
- [ ] Configurar dominio
- [ ] Implementar SSL
- [ ] Realizar despliegue inicial

## Fase 7: Mantenimiento y Mejoras

### 7.1 Monitoreo
- [x] Implementar sistema de logging
- [ ] Configurar monitoreo de errores
- [ ] Implementar analytics básicos
- [ ] Crear dashboard de monitoreo simple

### 7.2 Mejoras Continuas
- [x] Recolectar feedback de usuarios
- [x] Implementar mejoras de UI/UX basadas en feedback
- [x] Optimizar rendimiento según métricas
- [x] Mantener dependencias actualizadas

## Fase 8: Implementación del Algoritmo de Votación

### 8.1 Implementación Completa del Algoritmo
- [x] Desarrollar la función determinarAccionSiguiente() en src/lib/voting.js
- [x] Implementar la función agruparIdeasPorVotos()
- [x] Crear función prepararNuevaRonda() para manejo de desempates
- [x] Desarrollar función finalizarSeleccion() para finalizar el proceso

### 8.2 Testing Exhaustivo de Casos de Votación
- [x] Implementar tests para todos los escenarios de votación:
  - [x] T01: 3 ideas con mismo número de votos (empatadas)
  - [x] T02: 2 ideas con más votos, 1 idea en segunda posición
  - [x] T03: 2 ideas con más votos, múltiples empatadas en segunda posición
  - [x] T04: 1 idea con más votos, 2 empatadas en segunda posición
  - [x] T05: 1 idea con más votos, 1 en segunda, 1 en tercera
  - [x] T06: 1 idea con más votos, 1 en segunda, múltiples en tercera
  - [x] T07: 1 idea con más votos, múltiples (>2) en segunda
  - [x] T08: Más de 3 ideas empatadas con mayor número de votos
  - [x] T09: Segunda ronda con ideas previamente elegidas
  - [x] T10: Tercera ronda para desempate final

### 8.3 Integración con Sistema de Notificaciones en Tiempo Real
- [x] Implementar eventos para notificar nueva ronda de votación
- [x] Crear eventos para comunicar resultados finales
- [x] Desarrollar sistema para sincronizar estado de votación entre usuarios
- [x] Manejar reconexiones durante el proceso de votación

## Fase 9: Accesibilidad e Internacionalización

### 9.1 Implementación de Accesibilidad
- [x] Auditar la aplicación con herramientas de accesibilidad
- [x] Implementar atributos ARIA apropiados
- [x] Asegurar navegación por teclado
- [x] Verificar contraste de colores
- [ ] Probar con lectores de pantalla

### 9.2 Internacionalización (opcional)
- [x] Extraer todos los textos a archivos independientes
- [ ] Implementar un sistema simple de cambio de idioma
- [ ] Adaptar vistas para manejar diferentes longitudes de texto
- [ ] Probar la aplicación en diferentes idiomas

## Timeline Estimado

### Fase 1: 1 semana ✅
- Configuración inicial
- Estructura del proyecto
- Base de datos

### Fase 2: 2 semanas ✅
- Autenticación
- Sesiones
- Ideas
- Votación

### Fase 3: 1 semana ✅
- Comunicación en tiempo real (sistema de polling)
- Sincronización

### Fase 4: 1 semana ✅
- UI/UX
- Componentes
- Pantallas

### Fase 5: 1 semana ⏳
- Optimización
- Testing
- Mobile

### Fase 6: 1 semana ⏳
- Producción
- Documentación
- Despliegue

### Fase 7-9: 2 semanas ⏳
- Algoritmo de votación
- Accesibilidad
- Mejoras finales

## Notas sobre implementación actual:
- Se reemplazó Socket.io con un sistema de polling HTTP para actualizaciones en tiempo real
- La Base de Datos SQLite utiliza el módulo nativo de Node.js v24+ en lugar de better-sqlite3
- Se implementó un sistema de notificaciones toast para eventos en tiempo real
- Se ha añadido soporte para enlaces de invitación directa a sesiones sin necesidad de código 