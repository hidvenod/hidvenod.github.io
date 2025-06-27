document.addEventListener('DOMContentLoaded', () => {
    // --- 全域變數 ---
    let allBooks = []; // 存放從 novels-list.json 讀取的完整書庫資料
    let currentChapterInfo = null; // 存放目前章節的完整資訊 { bookTitle, volumeTitle, chapter }

    // --- DOM 元素 ---
    const chapterTitleEl = document.getElementById('chapter-title');
    const novelContentEl = document.getElementById('novel-content');
    const navButtons = {
        prev: [document.getElementById('prev-chapter'), document.getElementById('prev-chapter-bottom')],
        next: [document.getElementById('next-chapter'), document.getElementById('next-chapter-bottom')]
    };

    // --- 主要邏輯 ---

    // 1. 初始化：讀取書庫清單，然後根據 URL 載入章節
    async function initializeReader() {
        try {
            const response = await fetch('novels-list.json');
            allBooks = await response.json();
            
            // 首次載入或刷新頁面時，根據 URL 參數載入章節
            loadChapterFromUrl();

        } catch (error) {
            console.error("初始化失敗:", error);
            displayError("無法載入書庫清單，請檢查 novels-list.json 檔案。");
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
            novelContentEl.textContent = text;
            
            // 更新目前章節資訊
            currentChapterInfo = findChapterInfo(path);
            if (currentChapterInfo) {
                chapterTitleEl.textContent = currentChapterInfo.chapter.title;
                document.title = `${currentChapterInfo.chapter.title} - ${currentChapterInfo.bookTitle}`; // 更新瀏覽器標籤頁標題
            }
            
            // 更新導覽按鈕的狀態
            updateNavigation();

        } catch (error) {
            console.error("載入章節失敗:", error);
            displayError(`載入章節 ${path} 失敗。`);
        }
    }

    // 3. 更新 URL：使用 History API，無刷新變更網址
    function updateUrlForChapter(path) {
        const url = new URL(window.location);
        url.searchParams.set('path', path);
        // pushState(stateObject, title, url)
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
        const { prev, next } = findAdjacentChapters(currentChapterInfo.chapter.path);
        
        navButtons.prev.forEach(btn => btn.disabled = !prev);
        navButtons.next.forEach(btn => btn.disabled = !next);
    }

    // --- 事件處理 ---

    // 處理點擊上一章/下一章
    function handleNavigationClick(direction) {
        const { prev, next } = findAdjacentChapters(currentChapterInfo.chapter.path);
        const targetPath = (direction === 'next') ? next : prev;
        
        if (targetPath) {
            loadChapter(targetPath);
            updateUrlForChapter(targetPath);
        }
    }

    // 監聽按鈕點擊
    navButtons.prev.forEach(btn => btn.addEventListener('click', () => handleNavigationClick('prev')));
    navButtons.next.forEach(btn => btn.addEventListener('click', () => handleNavigationClick('next')));

    // 監聽瀏覽器的前進/後退按鈕
    window.addEventListener('popstate', (event) => {
        // 當使用者點擊瀏覽器 back/forward 時，從 state 中讀取路徑並載入
        if (event.state && event.state.path) {
            loadChapter(event.state.path);
        } else {
            // 如果 state 為空 (例如，回到了最初的頁面)，則重新從 URL 讀取
            loadChapterFromUrl();
        }
    });


    // --- 輔助工具函式 ---

    // 在書庫資料中尋找指定路徑的章節詳細資訊
    function findChapterInfo(path) {
        for (const book of allBooks) {
            for (const volume of book.volumes) {
                const chapter = volume.chapters.find(c => c.path === path);
                if (chapter) {
                    return { bookTitle: book.title, volumeTitle: volume.title, chapter };
                }
            }
        }
        return null;
    }

    // 尋找相鄰的章節路徑
    function findAdjacentChapters(path) {
        let prev = null, next = null;
        let allChaptersFlat = allBooks.flatMap(b => b.volumes).flatMap(v => v.chapters);
        const currentIndex = allChaptersFlat.findIndex(c => c.path === path);

        if (currentIndex > 0) {
            prev = allChaptersFlat[currentIndex - 1].path;
        }
        if (currentIndex < allChaptersFlat.length - 1) {
            next = allChaptersFlat[currentIndex + 1].path;
        }
        return { prev, next };
    }

    function displayError(message) {
        chapterTitleEl.textContent = '錯誤';
        novelContentEl.innerHTML = `<p style="color: red;">${message}</p>`;
    }
    
    function displayLoading() {
        chapterTitleEl.textContent = '讀取中...';
        novelContentEl.textContent = '';
    }

    // --- 程式入口 ---
    initializeReader();
});