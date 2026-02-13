#!/usr/bin/env node

// Force load environment variables
require('dotenv').config({ path: '.env' });

console.log('🔧 [Environment] Loading environment variables...');
console.log('🔧 [Environment] API_URL:', process.env.API_URL);
console.log('🔧 [Environment] Firebase config loaded');
