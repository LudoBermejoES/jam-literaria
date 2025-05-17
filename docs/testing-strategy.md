# Estrategia de Testing para la Aplicación Jam Literaria

Este documento describe la estrategia de testing para la aplicación Jam Literaria basada en Node.js con renderizado en servidor.

## Objetivos

- Garantizar la calidad y fiabilidad del código
- Detectar errores tempranamente en el ciclo de desarrollo
- Facilitar la refactorización y mantenimiento
- Documentar el comportamiento esperado del sistema
- Asegurar que los flujos críticos de usuario funcionan correctamente

## Niveles de Testing

### 1. Tests Unitarios

Enfocados en probar funciones y módulos individuales aisladamente.

#### Áreas de Cobertura

- **Modelos de datos**: Validación de operaciones CRUD en tablas
- **Utilidades**: Funciones auxiliares, generadores de códigos, algoritmos
- **Middleware**: Funciones de autenticación, validación
- **Lógica de negocio**: Especialmente el algoritmo de votación

#### Herramientas
- Jest como framework de testing
- Mocks para aislar dependencias

#### Ejemplo de Test Unitario

```javascript
// tests/unit/models/user.test.js
const { createUser, getUserById } = require('../../../src/models/User');
const db = require('../../../src/lib/db');

// Mock de la base de datos
jest.mock('../../../src/lib/db');

describe('User Model', () => {
  beforeEach(() => {
    // Limpiar todos los mocks
    jest.clearAllMocks();
  });

  test('createUser should insert a user and return the created user', async () => {
    const mockUser = { id: '123', name: 'Test User' };
    
    // Configurar el mock para que simule la inserción exitosa
    db.run.mockResolvedValue({ lastID: '123' });
    db.get.mockResolvedValue(mockUser);
    
    const result = await createUser('Test User');
    
    expect(db.run).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });
  
  test('getUserById should return user if found', async () => {
    const mockUser = { id: '123', name: 'Test User' };
    
    db.get.mockResolvedValue(mockUser);
    
    const result = await getUserById('123');
    
    expect(db.get).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM users'), 
      ['123']
    );
    expect(result).toEqual(mockUser);
  });
  
  test('getUserById should return null if user not found', async () => {
    db.get.mockResolvedValue(null);
    
    const result = await getUserById('999');
    
    expect(result).toBeNull();
  });
});
```

### 2. Tests de Integración

Verifican que diferentes componentes del sistema funcionan correctamente juntos.

#### Áreas de Cobertura

- **Rutas API**: Verificar que las rutas procesan correctamente las peticiones
- **Flujo de datos**: Comprobar que los datos fluyen correctamente entre componentes
- **Renderizado de vistas**: Asegurar que se renderizan las plantillas EJS correctas
- **Interacción con base de datos**: Verificar operaciones completas de persistencia

#### Herramientas
- Jest como framework de testing
- Supertest para simular peticiones HTTP
- Base de datos de prueba (SQLite en memoria)

#### Ejemplo de Test de Integración

```javascript
// tests/integration/routes/auth.test.js
const request = require('supertest');
const { app } = require('../../../src/app');
const { setupTestDb, teardownTestDb } = require('../../helpers/db');

describe('Auth Routes', () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  
  afterAll(async () => {
    await teardownTestDb();
  });
  
  test('POST /auth/register should create a new user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ name: 'New User' })
      .expect(200);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('New User');
  });
  
  test('POST /auth/register should return 400 for empty name', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ name: '' })
      .expect(400);
    
    expect(response.body).toHaveProperty('error');
  });
  
  test('GET /auth/me should return user if authenticated', async () => {
    // Primero registramos un usuario y guardamos la cookie de sesión
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({ name: 'Test Session User' });
    
    const cookies = registerResponse.headers['set-cookie'];
    
    // Usamos la cookie para hacer la petición autenticada
    const response = await request(app)
      .get('/auth/me')
      .set('Cookie', cookies)
      .expect(200);
    
    expect(response.body.name).toBe('Test Session User');
  });
  
  test('GET /auth/me should return 401 if not authenticated', async () => {
    await request(app)
      .get('/auth/me')
      .expect(401);
  });
});
```

### 3. Tests End-to-End

Verifican flujos completos de usuario simulando interacciones reales.

#### Áreas de Cobertura

- **Flujos de usuario**: Registro, creación de sesión, votación, etc.
- **Comunicación en tiempo real**: Verificar que Socket.io funciona correctamente
- **Integración completa**: Probar toda la aplicación como un sistema unificado
- **Casos edge y escenarios complejos**: Desconexiones, reconexiones, casos límite

#### Herramientas
- Jest como framework de testing
- Puppeteer para automatizar navegador
- Socket.io-client para probar comunicación en tiempo real

#### Ejemplo de Test End-to-End

```javascript
// tests/e2e/session-flow.test.js
const puppeteer = require('puppeteer');
const { startServer, stopServer } = require('../../src/app');
const { setupTestDb, teardownTestDb } = require('../helpers/db');

describe('Session Flow', () => {
  let server;
  let browser;
  let hostPage;
  let guestPage;
  
  beforeAll(async () => {
    await setupTestDb();
    server = await startServer(3001); // Puerto específico para tests
    browser = await puppeteer.launch({ headless: true });
  });
  
  afterAll(async () => {
    await browser.close();
    await stopServer(server);
    await teardownTestDb();
  });
  
  test('Complete session flow with two users', async () => {
    // Iniciar dos páginas (host y participante)
    hostPage = await browser.newPage();
    guestPage = await browser.newPage();
    
    // 1. Host registra nombre y crea sesión
    await hostPage.goto('http://localhost:3001');
    await hostPage.type('input[name=name]', 'Host User');
    await hostPage.click('button[type=submit]');
    await hostPage.waitForNavigation();
    
    await hostPage.click('a[href="/session/new"]');
    await hostPage.waitForSelector('.session-code');
    
    // Capturar código de sesión
    const sessionCode = await hostPage.$eval('.session-code', el => el.textContent);
    
    // 2. Guest registra nombre y se une a la sesión
    await guestPage.goto('http://localhost:3001');
    await guestPage.type('input[name=name]', 'Guest User');
    await guestPage.click('button[type=submit]');
    await guestPage.waitForNavigation();
    
    await guestPage.click('a[href="/session/join"]');
    await guestPage.type('input[name=code]', sessionCode);
    await guestPage.click('button[type=submit]');
    
    // 3. Host debería ver al guest conectado
    await hostPage.waitForFunction(
      () => document.querySelectorAll('.participant').length > 1
    );
    
    // 4. Host inicia la sesión
    await hostPage.click('#start-session');
    
    // 5. Ambos usuarios deberían pasar a la fase de ideas
    await Promise.all([
      hostPage.waitForNavigation(),
      guestPage.waitForNavigation()
    ]);
    
    // Verificar que ambos están en la página de ideas
    expect(await hostPage.url()).toContain('/ideas');
    expect(await guestPage.url()).toContain('/ideas');
    
    // Continuar con el resto del flujo...
    // - Envío de ideas
    // - Votación
    // - Resultados
  }, 30000); // Timeout más largo para tests e2e
});
```

### 4. Tests del Algoritmo de Votación

Específicamente para la lógica de votación y resolución de empates.

#### Casos de Prueba

- **T01**: 3 ideas con mismo número de votos (empatadas)
- **T02**: 2 ideas con más votos, 1 idea en segunda posición
- **T03**: 2 ideas con más votos, múltiples empatadas en segunda posición
- **T04**: 1 idea con más votos, 2 empatadas en segunda posición
- **T05**: 1 idea con más votos, 1 en segunda, 1 en tercera
- **T06**: 1 idea con más votos, 1 en segunda, múltiples en tercera
- **T07**: 1 idea con más votos, múltiples (>2) en segunda
- **T08**: Más de 3 ideas empatadas con mayor número de votos
- **T09**: Segunda ronda con ideas previamente elegidas
- **T10**: Tercera ronda para desempate final

#### Ejemplo de Test del Algoritmo

```javascript
// tests/unit/lib/voting.test.js
const { determinarAccionSiguiente } = require('../../../src/lib/voting');

describe('Algoritmo de votación', () => {
  test('T01: 3 ideas con mismo número de votos (empatadas)', () => {
    const ideas = [
      { id: '1', content: 'Idea 1', votos: 5 },
      { id: '2', content: 'Idea 2', votos: 5 },
      { id: '3', content: 'Idea 3', votos: 5 },
      { id: '4', content: 'Idea 4', votos: 2 }
    ];
    
    const resultado = determinarAccionSiguiente(ideas);
    
    expect(resultado.accion).toBe('FINALIZAR');
    expect(resultado.elegidas).toHaveLength(3);
    expect(resultado.elegidas.map(i => i.id)).toEqual(['1', '2', '3']);
  });
  
  test('T07: 1 idea con más votos, múltiples (>2) en segunda', () => {
    const ideas = [
      { id: '1', content: 'Idea 1', votos: 8 },
      { id: '2', content: 'Idea 2', votos: 5 },
      { id: '3', content: 'Idea 3', votos: 5 },
      { id: '4', content: 'Idea 4', votos: 5 }
    ];
    
    const resultado = determinarAccionSiguiente(ideas);
    
    expect(resultado.accion).toBe('NUEVA_RONDA');
    expect(resultado.elegidas).toHaveLength(1);
    expect(resultado.elegidas[0].id).toBe('1');
    expect(resultado.candidatas).toHaveLength(3);
    expect(resultado.candidatas.map(i => i.id)).toEqual(['2', '3', '4']);
  });
  
  // Más casos de prueba aquí...
});
```

## Estrategia de Mocking

### Base de Datos
Utilizaremos SQLite en memoria para tests de integración y e2e. Para tests unitarios, mockearemos el módulo db.js.

### Socket.io
- Para tests unitarios: Mock completo
- Para integración: Socket.io-client para simular conexiones

### Sesiones Express
Mock de express-session para tests unitarios y de integración.

## Helpers de Testing

Desarrollaremos un conjunto de helpers para facilitar el testing:

```javascript
// tests/helpers/db.js
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

let db;

const setupTestDb = async () => {
  db = new Database(':memory:');
  
  // Cargar esquema SQL
  const schema = fs.readFileSync(
    path.join(__dirname, '../../database/schema.sql'),
    'utf8'
  );
  
  // Ejecutar queries para crear tablas
  const statements = schema.split(';').filter(stmt => stmt.trim());
  for (const stmt of statements) {
    db.exec(stmt);
  }
  
  // Cargar datos de prueba si es necesario
  // ...
  
  // Reemplazar la conexión real con la de prueba
  const dbModule = require('../../src/lib/db');
  dbModule.getConnection = () => db;
  
  return db;
};

const teardownTestDb = async () => {
  if (db) {
    db.close();
  }
};

module.exports = { setupTestDb, teardownTestDb };
```

## Organización de Tests

```
tests/
├── unit/                    # Tests unitarios
│   ├── models/              # Tests de modelos
│   ├── middleware/          # Tests de middleware
│   ├── lib/                 # Tests de utilidades
│   └── routes/              # Tests de controladores
├── integration/             # Tests de integración
│   ├── auth/                # Tests de autenticación
│   ├── session/             # Tests de sesiones
│   ├── ideas/               # Tests de ideas
│   └── voting/              # Tests de votación
├── e2e/                     # Tests end-to-end
│   ├── auth-flow.test.js    # Flujo de autenticación
│   ├── session-flow.test.js # Flujo de sesión
│   └── voting-flow.test.js  # Flujo de votación
└── helpers/                 # Utilidades para testing
    ├── db.js                # Configuración de BD de prueba
    ├── auth.js              # Helpers de autenticación
    └── socket.js            # Helpers para Socket.io
```

## Estrategia de Ejecución de Tests

### Durante Desarrollo
- Ejecución continua de tests unitarios
- Ejecución periódica de tests de integración

### En Integración Continua
- Ejecución completa de todos los tests
- Coverage report (objetivo: >80%)
- Fallar el build si los tests no pasan

## Convenciones de Nomenclatura

- Archivos de test: `[nombre-archivo].test.js`
- Bloques describe: Descripción clara de la funcionalidad probada
- Casos de test: Verbo + descripción clara del comportamiento esperado

## Métricas de Calidad

- Cobertura de código: >80% global
- Todos los flujos críticos cubiertos
- Tests específicos para casos edge y manejo de errores

Esta estrategia de testing asegurará la calidad de la aplicación Jam Literaria, facilitando el desarrollo y mantenimiento a largo plazo. 