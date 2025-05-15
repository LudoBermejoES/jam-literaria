#!/usr/bin/env node

/**
 * Script para configurar Prisma en un entorno de producción.
 * Este script genera la configuración necesaria para usar una base de datos
 * PostgreSQL en producción en lugar de SQLite que se usa en desarrollo.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Plantilla de schema.prisma para producción con PostgreSQL
const postgresPrismaSchema = `
// This is your Prisma schema file for production
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Definición de modelos (copie sus modelos actuales aquí)
model User {
  id           String     @id @default(uuid())
  name         String
  sessions     Session[]  @relation("SessionParticipants")
  ownedSessions Session[] @relation("SessionOwner")
  ideas        Idea[]
  votes        Vote[]
  createdAt    DateTime   @default(now())
  lastActive   DateTime   @default(now())
}

model Session {
  id           String     @id @default(uuid())
  code         String     @unique
  status       String     @default("WAITING")
  currentRound Int        @default(0)
  owner        User       @relation("SessionOwner", fields: [ownerId], references: [id])
  ownerId      String
  participants User[]     @relation("SessionParticipants")
  ideas        Idea[]
  votes        Vote[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model Idea {
  id        String   @id @default(uuid())
  content   String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  session   Session  @relation(fields: [sessionId], references: [id])
  sessionId String
  votes     Vote[]
  createdAt DateTime @default(now())
}

model Vote {
  id        String   @id @default(uuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  idea      Idea     @relation(fields: [ideaId], references: [id])
  ideaId    String
  session   Session  @relation(fields: [sessionId], references: [id])
  sessionId String
  round     Int
  createdAt DateTime @default(now())

  @@unique([userId, ideaId, round, sessionId])
}
`;

// Función principal
async function setupProductionPrisma() {
  try {
    // Verificar si existe la variable de entorno DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('Error: No se encontró la variable de entorno DATABASE_URL');
      console.log('\nAsegúrate de definir la URL de conexión a la base de datos PostgreSQL en tu archivo .env:');
      console.log('DATABASE_URL="postgresql://usuario:contraseña@host:puerto/db?schema=public"');
      process.exit(1);
    }

    // Crear archivo schema.prisma para producción
    const schemaPath = path.resolve(__dirname, './schema.production.prisma');
    fs.writeFileSync(schemaPath, postgresPrismaSchema);

    console.log('\n=== Configuración de Prisma para Producción ===');
    console.log('\nSe ha creado el archivo schema.production.prisma');
    console.log('\nPara generar el cliente de Prisma para producción, ejecuta:');
    console.log('npx prisma generate --schema=./prisma/schema.production.prisma');
    console.log('\nPara ejecutar las migraciones en producción, ejecuta:');
    console.log('npx prisma migrate deploy --schema=./prisma/schema.production.prisma');
    console.log('\n¡Importante! Asegúrate de que la base de datos PostgreSQL esté configurada correctamente.');
  } catch (error) {
    console.error('Error al configurar Prisma para producción:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
setupProductionPrisma(); 