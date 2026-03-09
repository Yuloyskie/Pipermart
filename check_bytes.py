file_path = r'c:\Users\User\Desktop\pipersmart - Copy\web\src\Components\User\Forum.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Find the search-button section
search_button_idx = content.find(b'className="search-button"')
if search_button_idx != -1:
    # Get 300 bytes around it
    start = max(0, search_button_idx - 50)
    end = min(len(content), search_button_idx + 300)
    snippet = content[start:end]
    print("HEX bytes around search-button:")
    print(snippet.hex())
    print("\nRepr:")
    print(repr(snippet))
else:
    print("search-button not found")
