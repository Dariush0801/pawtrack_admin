const fs = require('fs');
const path = require('path');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="30" fill="#000000" stroke="#ffffff" stroke-width="2"/>
  <circle cx="32" cy="32" r="26.5" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1" stroke-dasharray="3,2"/>
  <g fill="#ffffff">
    <ellipse cx="32" cy="18" rx="4.2" ry="5.8"/>
    <ellipse cx="20.5" cy="23.5" rx="4" ry="5.2" transform="rotate(-20 20.5 23.5)"/>
    <ellipse cx="43.5" cy="23.5" rx="4" ry="5.2" transform="rotate(20 43.5 23.5)"/>
    <path d="M32 30 C24.5 30 18.5 35 18.5 41.5 C18.5 46.8 22.8 50.5 27.5 50.5 C30.2 50.5 31.4 48.4 32 48.4 C32.6 48.4 33.8 50.5 36.5 50.5 C41.2 50.5 45.5 46.8 45.5 41.5 C45.5 35 39.5 30 32 30 Z"/>
  </g>
</svg>`;

const dataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

// Admin targets
const adminDir = path.resolve('E:/Codes/PawTrack (Admin)');
const ownerDir = path.resolve('E:/Codes/PawTrack');

// Write SVGs
fs.writeFileSync(path.join(adminDir, 'favicon.svg'), svgContent, 'utf8');
fs.writeFileSync(path.join(adminDir, 'assets/pawtrack-logo.svg'), svgContent, 'utf8');

if (fs.existsSync(ownerDir)) {
  fs.writeFileSync(path.join(ownerDir, 'favicon.svg'), svgContent, 'utf8');
  if (fs.existsSync(path.join(ownerDir, 'images'))) {
    fs.writeFileSync(path.join(ownerDir, 'images/favicon.svg'), svgContent, 'utf8');
    fs.writeFileSync(path.join(ownerDir, 'images/pawtrack-logo.svg'), svgContent, 'utf8');
  }
}

console.log('Favicon Data URI generated successfully!');
console.log('Length:', dataUri.length);
console.log('DataURI:', dataUri);
