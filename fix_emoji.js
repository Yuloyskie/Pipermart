const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/src/Components/User/Forum.jsx');

// Read file as buffer to handle bytes properly
const fileBuffer = fs.readFileSync(filePath);

// The corrupted emoji bytes: \xc3\xb0\xc5\xb8\xe2\x80\x9d\xc2\x8d
const searchEmojiBytes = Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xe2, 0x80, 0x9d, 0xc2, 0x8d]);

// SVG icon replacement
const svgIconText = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>`;
const svgIconBytes = Buffer.from(svgIconText, 'utf8');

// Find and replace the emoji bytes
let replacedContent = fileBuffer;
let foundIndex = replacedContent.indexOf(searchEmojiBytes);

if (foundIndex !== -1) {
  // Replace the emoji bytes with SVG bytes
  replacedContent = Buffer.concat([
    replacedContent.slice(0, foundIndex),
    svgIconBytes,
    replacedContent.slice(foundIndex + searchEmojiBytes.length)
  ]);
  
  // Write back to file
  fs.writeFileSync(filePath, replacedContent);
  console.log('✓ Successfully replaced emoji with SVG icon');
} else {
  console.log('✗ Emoji bytes not found');
}
