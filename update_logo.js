const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/src/Components/User/Forum.jsx');

// Read file
let content = fs.readFileSync(filePath, 'utf8');

// Replace any SVG in the search button with img tag
const svgPattern = /<svg[^>]*>[\s\S]*?<\/svg>/;
const imgTag = `<img src="/search-icon.svg" alt="Search" />`;

if (svgPattern.test(content)) {
  content = content.replace(svgPattern, imgTag);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Successfully updated search button to use logo image');
} else {
  console.log('SVG not found in file');
}
