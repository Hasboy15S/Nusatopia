import json, re, base64, os

transcript_path = r'C:\Users\smart-user\.gemini\antigravity-ide\brain\d952ed82-f568-4e2f-ba16-388aa07ad947\.system_generated\logs\transcript_full.jsonl'
assets_dir = r'C:\Hasboy\All_Project\Nusatopia\frontend\public\assets'
html_content = ''

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'USER_INPUT' and 'NUSATOPIA — PETUALANGAN ILMU' in data.get('content', ''):
            html_content = data['content']
            break

if html_content:
    matches = re.finditer(r'"([^"]+)":"data:image/([^;]+);base64,([A-Za-z0-9+/=]+)"', html_content)
    for match in matches:
        key = match.group(1)
        img_type = match.group(2)
        b64_data = match.group(3)
        b64_data += '=' * ((4 - len(b64_data) % 4) % 4)
        filename = f'{key}.{img_type}'
        filepath = os.path.join(assets_dir, filename)
        try:
            with open(filepath, 'wb') as img_file:
                img_file.write(base64.b64decode(b64_data))
            print(f'Saved {filename}')
        except Exception as e:
            print(f'Failed {filename}: {e}')
