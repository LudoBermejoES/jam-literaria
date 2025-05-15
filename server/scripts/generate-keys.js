#!/usr/bin/env node

/**
 * Script para generar claves secretas JWT para uso en producción.
 * Este script genera una clave segura aleatoria para usar en el archivo .env
 */

const crypto = require('crypto');

// Generar una clave secreta aleatoria de 64 caracteres hexadecimales
const generateSecretKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const secretKey = generateSecretKey();

console.log('\n=== JWT Secret Key para Producción ===\n');
console.log(`JWT_SECRET=${secretKey}`);
console.log('\nAgrega esta línea a tu archivo .env en producción para aumentar la seguridad.\n'); 