import os
import json
from datetime import datetime
import unicodedata
import re

# --- 設定區 ---
NOVOS_DIR = 'novels'
MASTER_LIST_FILE = 'novels-list.json'
BOOK_META_FILENAME = 'book.json'
RECENT_CHAPTERS_COUNT = 10

def generate_slug(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '-', text)

def update_metadata():
    # 1. 讀取主索引，如果不存在則初始化
    try:
        with open(MASTER_LIST_FILE, 'r', encoding='utf-8') as f:
            master_list = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        master_list = {"books": [], "recent_chapters": []}
    
    master_books_map = {book['title']: book for book in master_list['books']}
    all_chapters_globally = []
    
    # 2. 遍歷 novels 資料夾，尋找每一本書
    for book_title_str in os.listdir(NOVOS_DIR):
        book_dir = os.path.join(NOVOS_DIR, book_title_str)
        if not os.path.isdir(book_dir):
            continue

        # 3. 處理每本書的 book.json
        book_meta_path = os.path.join(book_dir, BOOK_META_FILENAME)
        try:
            with open(book_meta_path, 'r', encoding='utf-8') as f:
                book_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # 如果 book.json 不存在，初始化一個
            book_data = {"title": book_title_str, "author": "", "description": "", "volumes": []}

        # 用一個 map 來快速查找章節和卷冊，避免重複遍歷
        volumes_map = {vol['title']: vol for vol in book_data['volumes']}
        chapters_map = {chap['path']: chap for vol in book_data['volumes'] for chap in vol['chapters']}
        
        book_has_changed = False
        latest_update_time = "1970-01-01T00:00:00Z"

        # 4. 掃描實體檔案，與 book.json 比對
        for root, _, files in os.walk(book_dir):
            if BOOK_META_FILENAME in files:
                files.remove(BOOK_META_FILENAME)

            for file in files:
                if not file.endswith('.txt'):
                    continue
                
                full_path = os.path.join(root, file).replace(os.sep, '/')
                mtime = os.path.getmtime(full_path)
                timestamp = datetime.fromtimestamp(mtime).isoformat() + "Z"
                
                if timestamp > latest_update_time:
                    latest_update_time = timestamp

                # 檢查章節是否已存在
                if full_path in chapters_map:
                    # 更新時間戳記
                    if chapters_map[full_path]['updated_at'] != timestamp:
                        chapters_map[full_path]['updated_at'] = timestamp
                        book_has_changed = True
                else:
                    # 發現新章節！
                    book_has_changed = True
                    volume_title_str = os.path.basename(root)
                    chapter_title_str = os.path.splitext(file)[0]
                    
                    new_chapter = {
                        "title": chapter_title_str,
                        "path": full_path,
                        "created_at": timestamp,
                        "updated_at": timestamp
                    }

                    # 如果卷不存在，則建立新卷
                    if volume_title_str not in volumes_map:
                        new_volume = {"title": volume_title_str, "chapters": []}
                        book_data['volumes'].append(new_volume)
                        volumes_map[volume_title_str] = new_volume
                    
                    # 將新章節附加到對應的卷末尾
                    volumes_map[volume_title_str]['chapters'].append(new_chapter)
                    print(f"發現新章節: [{book_title_str}] {volume_title_str} - {chapter_title_str}")

        # 5. 如果 book.json 有變更，則寫回檔案
        if book_has_changed:
            with open(book_meta_path, 'w', encoding='utf-8') as f:
                json.dump(book_data, f, ensure_ascii=False, indent=2)

        # 6. 更新或新增書籍資訊到主索引
        if book_title_str not in master_books_map:
            # 新書
            new_book_entry = {
                "slug": generate_slug(book_title_str),
                "title": book_title_str,
                "author": book_data.get('author', ''),
                "description": book_data.get('description', ''),
                "last_updated": latest_update_time,
                "meta_path": book_meta_path
            }
            master_list['books'].append(new_book_entry)
        else:
            # 更新現有書籍資訊
            master_books_map[book_title_str]['last_updated'] = latest_update_time
            master_books_map[book_title_str]['author'] = book_data.get('author', '')
            master_books_map[book_title_str]['description'] = book_data.get('description', '')

        # 7. 收集所有章節用於全域排序
        for vol in book_data['volumes']:
            for chap in vol['chapters']:
                all_chapters_globally.append({
                    "book_title": book_title_str,
                    "chapter_title": chap['title'],
                    "path": chap['path'],
                    "created_at": chap['created_at']
                })

    # 8. 更新主索引中的「最近新增」列表
    all_chapters_globally.sort(key=lambda x: x['created_at'], reverse=True)
    master_list['recent_chapters'] = all_chapters_globally[:RECENT_CHAPTERS_COUNT]
    
    # 9. 寫回主索引檔案
    with open(MASTER_LIST_FILE, 'w', encoding='utf-8') as f:
        # Re-sync books from the map to the list to preserve order
        master_list['books'] = list(master_books_map.values())
        json.dump(master_list, f, ensure_ascii=False, indent=2)

    print(f"成功維護元數據，主索引包含 {len(master_list['books'])} 本書。")

if __name__ == '__main__':
    update_metadata()