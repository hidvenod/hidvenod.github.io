document.addEventListener('DOMContentLoaded', () => {
    const recentUpdatesContainer = document.getElementById('recent-updates-container');
    const bookLibraryContainer = document.getElementById('book-library-container');
    const sidebarBookList = document.getElementById('sidebar-book-list');
    const particlesContainer = document.querySelector('.particles');

    // --- 動態背景 --- //
    function createParticles() {
        const particleCount = 50; // 粒子數量
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const size = Math.random() * 5 + 1; // 1px to 6px
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;

            // 隨機顏色
            const color = Math.random() > 0.5 ? 'var(--glow-blue)' : 'var(--glow-magenta)';
            particle.style.backgroundColor = color;

            particle.style.left = `${Math.random() * 100}%`;
            // 動畫延遲，讓粒子錯開出現
            const delay = Math.random() * 20;
            const duration = Math.random() * 20 + 10; // 10s to 30s
            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;

            particlesContainer.appendChild(particle);
        }
    }

    // --- 主函數：獲取數據並渲染頁面 --- //
    async function initializePage() {
        try {
            const response = await fetch('./novels-list.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // 渲染主內容
            renderRecentUpdates(data.recent_chapters || []);
            renderBookLibrary(data.books || []);
            
            // 渲染側邊欄
            renderSidebar(data.books || []);

        } catch (error) {
            console.error("頁面初始化失敗:", error);
            recentUpdatesContainer.innerHTML = '<p style="text-align: center; color: var(--glow-magenta);">無法載入最近更新。</p>';
            bookLibraryContainer.innerHTML = '<p style="text-align: center; color: var(--glow-magenta);">無法載入書庫。</p>';
        }
    }

    // 渲染最近更新的章節
    function renderRecentUpdates(chapters) {
        if (chapters.length === 0) {
            recentUpdatesContainer.innerHTML = '<p style="text-align: center;">暫無更新記錄。</p>';
            return;
        }
        recentUpdatesContainer.innerHTML = '';
        chapters.forEach(chapter => {
            const link = document.createElement('a');
            link.href = `reader.html?path=${encodeURIComponent(chapter.path)}`;
            link.className = 'recent-chapter-link';
            const updateDate = new Date(chapter.created_at);
            const timeString = `${updateDate.getMonth() + 1}/${updateDate.getDate()}`;
            link.innerHTML = `
                <div>
                    <span class="recent-chapter-title">${chapter.chapter_title}</span>
                    <span class="recent-book-title">[${chapter.book_title}]</span>
                </div>
                <span class="recent-update-time">${timeString}</span>
            `;
            recentUpdatesContainer.appendChild(link);
        });
    }

    // 渲染書庫中的所有書籍
    function renderBookLibrary(books) {
        if (books.length === 0) {
            bookLibraryContainer.innerHTML = '<p style="text-align: center;">書庫為空。</p>';
            return;
        }
        bookLibraryContainer.innerHTML = '';
        books.forEach(book => {
            const card = document.createElement('a');
            card.href = `book.html?slug=${encodeURIComponent(book.slug)}`;
            card.className = 'book-card';
            card.innerHTML = `
                <h3 class="book-card-title">${book.title}</h3>
                <p class="book-card-author">作者：${book.author || '未知'}</p>
                <p class="book-card-desc">${book.description || '暫無簡介'}</p>
            `;
            bookLibraryContainer.appendChild(card);
        });
    }

    // 渲染側邊導航欄
    function renderSidebar(books) {
        if (books.length === 0) {
            sidebarBookList.innerHTML = '<li><a href="#">書庫為空</a></li>';
            return;
        }
        sidebarBookList.innerHTML = '';
        books.forEach(book => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `book.html?slug=${encodeURIComponent(book.slug)}`;
            link.textContent = book.title;
            listItem.appendChild(link);
            sidebarBookList.appendChild(listItem);
        });
    }

    // --- 程式入口 ---
    createParticles();
    initializePage();
});
