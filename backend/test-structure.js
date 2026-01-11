// Simple structure test - validates that all required functions exist
const assert = require('assert');

console.log('🧪 Testing backend structure...\n');

// Test 1: Check required dependencies exist
console.log('Test 1: Checking dependencies...');
try {
    const express = require('express');
    const cors = require('cors');
    const nodemailer = require('nodemailer');
    const cron = require('node-cron');
    const dotenv = require('dotenv');
    console.log('✅ All dependencies found\n');
} catch (error) {
    console.error('❌ Missing dependencies:', error.message);
    process.exit(1);
}

// Test 2: Check module exports
console.log('Test 2: Checking module exports...');
try {
    const emailService = require('./emailService');
    assert(typeof emailService.sendReminderEmail === 'function', 'sendReminderEmail should be a function');
    assert(typeof emailService.encryptPassword === 'function', 'encryptPassword should be a function');
    console.log('✅ emailService exports correct\n');
} catch (error) {
    console.error('❌ emailService exports failed:', error.message);
    process.exit(1);
}

// Test 3: Check scheduler exports
console.log('Test 3: Checking scheduler...');
try {
    const scheduler = require('./scheduler');
    assert(typeof scheduler.initializeScheduler === 'function', 'initializeScheduler should be a function');
    assert(typeof scheduler.checkAndSendReminders === 'function', 'checkAndSendReminders should be a function');
    console.log('✅ scheduler exports correct\n');
} catch (error) {
    console.error('❌ scheduler exports failed:', error.message);
    process.exit(1);
}

// Test 4: Check middleware exports
console.log('Test 4: Checking middleware...');
try {
    const verifyFirebaseToken = require('./middleware/auth');
    const verifyAdmin = require('./middleware/adminCheck');
    assert(typeof verifyFirebaseToken === 'function', 'verifyFirebaseToken should be a function');
    assert(typeof verifyAdmin === 'function', 'verifyAdmin should be a function');
    console.log('✅ Middleware exports correct\n');
} catch (error) {
    console.error('❌ Middleware exports failed:', error.message);
    process.exit(1);
}

// Test 5: Check environment variables are loaded
console.log('Test 5: Checking environment configuration...');
require('dotenv').config();
const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'ADMIN_EMAIL', 'PORT'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
    console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
    console.warn('   (This is expected for testing without .env file)\n');
} else {
    console.log('✅ Environment variables configured\n');
}

console.log('🎉 All structure tests passed!');
console.log('\nNote: These tests only validate code structure.');
console.log('Full functionality requires valid Firebase credentials and SMTP configuration.');
