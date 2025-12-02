#!/usr/bin/env node

/**
 * Icon Generation Script for PWA
 * 
 * This script helps generate PWA icons from the existing logo.svg
 * 
 * To use this script:
 * 1. Install sharp: npm install --save-dev sharp
 * 2. Run: node generate-icons.js
 * 
 * Or manually create the icons:
 * - icon-192.png: 192x192 pixels
 * - icon-512.png: 512x512 pixels
 * 
 * You can use online tools like:
 * - https://realfavicongenerator.net/
 * - https://www.favicon-generator.org/
 * - Or any image editor to resize your logo.svg
 */

const fs = require('fs');
const path = require('path');

console.log('PWA Icon Generation Helper');
console.log('==========================');
console.log('');
console.log('To create PWA icons for your app:');
console.log('');
console.log('1. Use the existing logo.svg as your base');
console.log('2. Create two PNG files:');
console.log('   - icon-192.png (192x192 pixels)');
console.log('   - icon-512.png (512x512 pixels)');
console.log('');
console.log('3. Place them in the /public directory');
console.log('');
console.log('Online tools you can use:');
console.log('- https://realfavicongenerator.net/');
console.log('- https://www.favicon-generator.org/');
console.log('- https://convertio.co/svg-png/');
console.log('');
console.log('Or use command line tools like ImageMagick:');
console.log('convert logo.svg -resize 192x192 icon-192.png');
console.log('convert logo.svg -resize 512x512 icon-512.png');
console.log('');

// Check if logo.svg exists
const logoPath = path.join(__dirname, 'public', 'logo.svg');
if (fs.existsSync(logoPath)) {
  console.log('✓ Found logo.svg in public directory');
  console.log('You can use this as the base for your PWA icons');
} else {
  console.log('⚠ No logo.svg found in public directory');
  console.log('You may need to create a logo first');
}









