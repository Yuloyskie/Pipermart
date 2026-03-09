#!/usr/bin/env python3
import re

file_path = r'c:\Users\User\Desktop\pipersmart - Copy\web\src\Components\User\Forum.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# SVG icon for search
svg_icon = '''<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>'''

# Find and replace the emoji in the search button
# Looking for the pattern: >emoji</button>
pattern = r'>\s*🔍\s*</button>'
replacement = f'>\n                  {svg_icon}\n                </button>'

content = re.sub(pattern, replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ Successfully replaced emoji with SVG icon')
