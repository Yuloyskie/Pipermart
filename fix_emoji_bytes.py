import re

file_path = r'c:\Users\User\Desktop\pipersmart - Copy\web\src\Components\User\Forum.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# The corrupted emoji bytes found in the file
# \xc3\xb0\xc5\xb8\xe2\x80\x9d\xc2\x8d
corrupted_emoji = b'\xc3\xb0\xc5\xb8\xe2\x80\x9d\xc2\x8d'

# SVG icon to replace with
svg_icon = b'''<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>'''

# Replace the emoji with the SVG
old_content = content
content = content.replace(corrupted_emoji, svg_icon)

if content != old_content:
    with open(file_path, 'wb') as f:
        f.write(content)
    print('✓ Successfully replaced corrupted emoji with SVG icon')
else:
    print('✗ Emoji not found in file')
