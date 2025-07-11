import os
import json
from datetime import datetime
import unicodedata
import re
from pypinyin import pinyin, Style

# --- 設定區 ---
# 取得此腳本檔案所在的目錄
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# 假設專案根目錄是 scripts 資料夾的上一層
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR) 

# 使用絕對路徑來定義檔案和資料夾
NOVOS_DIR = os.path.join(PROJECT_ROOT, 'novels')
MASTER_LIST_FILE = os.path.join(PROJECT_ROOT, 'novels-list.json')
BOOK_META_FILENAME = 'book.json'
RECENT_CHAPTERS_COUNT = 5

# ... 後面的程式碼不變 ...
def generate_slug(text):
    pinyin_list = pinyin(text, style=Style.NORMAL)
    text = ' '.join(item[0] if isinstance(item, list) and item else item for item in pinyin_list)
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
            book_data = {"slug": "", "title": book_title_str, "author": "", "description": "", "volumes": []}

        # 檢查並產生 slug，確保 book.json 中有 slug
        if 'slug' not in book_data or not book_data['slug']:
            book_data['slug'] = generate_slug(book_data['title'])
            # 因為我們修改了 book.json 的內容，所以標記為需要儲存
            book_has_changed = True 
            print(f"為書籍 [{book_title_str}] 產生了新的 slug: {book_data['slug']}")

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
                
                # ... 在 for file in files: 迴圈內部 ...

                full_path = os.path.join(root, file).replace(os.sep, '/')
                mtime = os.path.getmtime(full_path)
                timestamp = datetime.fromtimestamp(mtime).isoformat() + "Z"

                # 【關鍵修改】將絕對路徑轉換為相對於專案根目錄的相對路徑
                relative_path = os.path.relpath(full_path, PROJECT_ROOT).replace(os.sep, '/')
                
                if timestamp > latest_update_time:
                    latest_update_time = timestamp

                # 檢查章節是否已存在
                if relative_path in chapters_map:
                    # 更新時間戳記
                    if chapters_map[relative_path]['updated_at'] != timestamp:
                        chapters_map[relative_path]['updated_at'] = timestamp
                        book_has_changed = True
                else:
                    # 發現新章節！
                    book_has_changed = True
                    volume_title_str = os.path.basename(root)
                    chapter_title_str = os.path.splitext(file)[0]
                    
                    new_chapter = {
                        "title": chapter_title_str,
                        "path": relative_path,
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
                "slug": book_data.get('slug', ''),
                "title": book_title_str,
                "author": book_data.get('author', ''),
                "description": book_data.get('description', ''),
                "last_updated": latest_update_time,
                "meta_path": os.path.relpath(book_meta_path, PROJECT_ROOT).replace(os.sep, '/') #【建議修改】路徑統一用相對路徑
            }
            # 【關鍵修復】將新書同時加入到 map 中
            master_books_map[book_title_str] = new_book_entry
        else:
            # 更新現有書籍資訊
            master_books_map[book_title_str]['slug'] = book_data.get('slug')
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