document.addEventListener('DOMContentLoaded', () => {
    // --- 全域變數 ---
    let allBooksData = []; // 存放從 novels-list.json 讀取的完整書庫資料
    let currentBook = null; // 存放目前閱讀的書籍資料 (book.json 的內容)
    let currentChapterIndex = -1; // 目前章節在 currentBook.chaptersFlat 中的索引
    let chaptersFlat = []; // 當前書籍所有章節的扁平化列表

    // --- DOM 元素 ---
    const chapterTitleEl = document.getElementById('chapter-title');
    const novelContentEl = document.getElementById('novel-content');
    const backToTocBtn = document.getElementById('back-to-toc');
    const navButtons = {
        prev: [document.getElementById('prev-chapter'), document.getElementById('prev-chapter-bottom')],
        next: [document.getElementById('next-chapter'), document.getElementById('next-chapter-bottom')]
    };

    // --- 主要邏輯 ---

    // 1. 初始化：讀取書庫清單，然後根據 URL 載入章節
    async function initializeReader() {
        try {
            // 讀取主列表以獲取所有書籍的元數據路徑
            const listResponse = await fetch('./novels-list.json');
            if (!listResponse.ok) throw new Error('無法載入書庫列表。');
            const masterList = await listResponse.json();
            allBooksData = masterList.books; // 儲存所有書籍的元數據

            // 首次載入或刷新頁面時，根據 URL 參數載入章節
            loadChapterFromUrl();

        } catch (error) {
            console.error("初始化失敗:", error);
            displayError("無法載入書庫清單，請檢查 novels-list.json 檔案。", error.message);
        }
    }

    // 2. 核心功能：根據指定路徑載入並顯示章節內容
    async function loadChapter(path) {
        if (!path) {
            displayError("無效的章節路徑。");
            return;
        }

        displayLoading();

        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`檔案讀取失敗 (HTTP ${response.status})`);
            
            const text = await response.text();
            // 將文本按換行符分割，並用 <p> 標籤包裹每個段落
            novelContentEl.innerHTML = text.split(/\r?\n/)
                                         .filter(p => p.trim() !== '') // 過濾空行
                                         .map(p => `<p>${p.trim()}</p>`).join('');
            
            // 更新目前章節資訊
            const chapterInfo = findChapterInfo(path);
            if (chapterInfo) {
                currentBook = chapterInfo.bookData;
                chaptersFlat = chapterInfo.chaptersFlat;
                currentChapterIndex = chapterInfo.chapterIndex;

                chapterTitleEl.textContent = chapterInfo.chapter.title;
                document.title = `${chapterInfo.chapter.title} - ${chapterInfo.bookData.title}`;
                
                // 更新返回目錄連結
                backToTocBtn.href = `book.html?slug=${encodeURIComponent(currentBook.slug)}`;
            }
            
            // 更新導覽按鈕的狀態
            updateNavigation();

        } catch (error) {
            console.error("載入章節失敗:", error);
            displayError(`載入章節 ${path} 失敗。`, error.message);
        }
    }

    // 3. 更新 URL：使用 History API，無刷新變更網址
    function updateUrlForChapter(path) {
        const url = new URL(window.location);
        url.searchParams.set('path', path);
        history.pushState({ path: path }, '', url.href);
    }
    
    // 4. 從 URL 參數載入章節 (頁面首次載入時觸發)
    function loadChapterFromUrl() {
        const urlParams = new URL(window.location).searchParams;
        const path = urlParams.get('path');
        if (path) {
            loadChapter(path);
        } else {
            displayError("請從書庫選擇一篇文章開始閱讀。");
        }
    }

    // 5. 更新上下章按鈕的可用狀態
    function updateNavigation() {
        navButtons.prev.forEach(btn => btn.disabled = (currentChapterIndex <= 0));
        navButtons.next.forEach(btn => btn.disabled = (currentChapterIndex >= chaptersFlat.length - 1));
    }

    // --- 事件處理 ---

    // 處理點擊上一章/下一章
    function handleNavigationClick(direction) {
        let targetIndex = currentChapterIndex;
        if (direction === 'next') {
            targetIndex++;
        } else {
            targetIndex--;
        }

        if (targetIndex >= 0 && targetIndex < chaptersFlat.length) {
            const targetPath = chaptersFlat[targetIndex].path;
            loadChapter(targetPath);
            updateUrlForChapter(targetPath);
        }
    }

    // 監聽按鈕點擊
    navButtons.prev.forEach(btn => btn.addEventListener('click', () => handleNavigationClick('prev')));
    navButtons.next.forEach(btn => btn.addEventListener('click', () => handleNavigationClick('next')));

    // 監聽瀏覽器的前進/後退按鈕
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.path) {
            loadChapter(event.state.path);
        } else {
            loadChapterFromUrl();
        }
    });


    // --- 輔助工具函式 ---

    // 在書庫資料中尋找指定路徑的章節詳細資訊
    async function findChapterInfo(chapterPath) {
        for (const bookMeta of allBooksData) {
            // 讀取每本書的 book.json
            const bookResponse = await fetch(bookMeta.meta_path);
            if (!bookResponse.ok) {
                console.warn(`無法載入書籍元數據：${bookMeta.meta_path}`);
                continue;
            }
            const bookData = await bookResponse.json();
            
            // 扁平化章節列表以便查找索引
            const chapters = bookData.volumes.flatMap(vol => vol.chapters);
            const chapterIndex = chapters.findIndex(c => c.path === chapterPath);

            if (chapterIndex !== -1) {
                return {
                    bookData: bookData,
                    chaptersFlat: chapters,
                    chapter: chapters[chapterIndex],
                    chapterIndex: chapterIndex
                };
            }
        }
        return null;
    }

    function displayError(message, details = '') {
        chapterTitleEl.textContent = '錯誤';
        novelContentEl.innerHTML = `<p style="color: #ff6b6b;">${message}</p><p style="color: #ff6b6b; font-size: 0.9em;">${details}</p>`;
    }
    
    function displayLoading() {
        chapterTitleEl.textContent = '讀取中...';
        novelContentEl.textContent = '';
    }

    // --- 程式入口 ---
    initializeReader();
});