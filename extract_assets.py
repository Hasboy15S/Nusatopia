import json
import re
import base64
import os

transcript_path = r"C:\Users\smart-user\.gemini\antigravity-ide\brain\d952ed82-f568-4e2f-ba16-388aa07ad947\.system_generated\logs\transcript_full.jsonl"
assets_dir = r"C:\Hasboy\All_Project\Nusatopia\frontend\public\assets"

os.makedirs(assets_dir, exist_ok=True)

html_content = ""
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT' and 'NUSATOPIA — PETUALANGAN ILMU' in data.get('content', ''):
                html_content = data['content']
                print("Found the HTML content!")
                break
        except Exception as e:
            pass

if not html_content:
    print("HTML content not found.")
else:
    # Find all base64 data URIs
    # Format: data:image/png;base64,.....
    matches = re.finditer(r'data:image/([^;]+);base64,([A-Za-z0-9+/=]+)', html_content)
    
    count = 0
    for i, match in enumerate(matches):
        img_type = match.group(1)
        b64_data = match.group(2)
        
        # Try to infer what the image is from the surrounding CSS or HTML
        # Look at the 100 characters before the match to find a class name or ID
        start_idx = max(0, match.start() - 100)
        context = html_content[start_idx:match.start()]
        
        filename = f"asset_{i}.{img_type}"
        if "player" in context.lower() or "character" in context.lower():
            filename = f"player.{img_type}"
        elif "tree" in context.lower() or "pohon" in context.lower():
            filename = f"tree.{img_type}"
        elif "rock" in context.lower() or "batu" in context.lower():
            filename = f"rock.{img_type}"
        elif "item" in context.lower() or "batik" in context.lower() or "borobudur" in context.lower() or "angklung" in context.lower():
            filename = f"item_{i}.{img_type}"
            
        filepath = os.path.join(assets_dir, filename)
        with open(filepath, "wb") as img_file:
            img_file.write(base64.b64decode(b64_data))
        print(f"Saved {filename}")
        count += 1
        
    print(f"Total base64 images extracted: {count}")

