const fs = require('fs');
const file = 'src/pages/Waiter.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find and log what's around "currentTotal <= 0"
const idx = content.indexOf('currentTotal <= 0');
if (idx === -1) {
  console.log('currentTotal <= 0 NOT FOUND');
} else {
  console.log('Found at index', idx);
  console.log('Context:', JSON.stringify(content.substring(idx-100, idx+300)));
}
