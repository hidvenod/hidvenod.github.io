document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素 ---
    const bookTitleEl = document.getElementById('book-title');
    const bookAuthorEl = document.getElementById('book-author');
    const bookDescriptionEl = document.getElementById('book-description');
    const tocContainer = document.getElementById('toc-container');
    const particlesContainer = document.querySelector('.particles');

    // --- 動態背景 (與主頁相同) ---
    function createParticles() {
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Math.random() * 5 + 1;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            const color = Math.random() > 0.5 ? 'var(--glow-blue)' : 'var(--glow-magenta)';
            particle.style.backgroundColor = color;
            particle.style.left = `${Math.random() * 100}%`;
            const delay = Math.random() * 20;
            const duration = Math.random() * 20 + 10;
            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;
            particlesContainer.appendChild(particle);
        }
    }

    // --- 主要邏輯 ---
    async function initializeBookPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const bookSlug = urlParams.get('slug');

        if (!bookSlug) {
            displayError('未指定書籍！請返回書庫選擇一本書。');
            return;
        }

        try {
            // 1. 讀取主列表以找到 book.json 的路徑
            const listResponse = await fetch('./novels-list.json');
            if (!listResponse.ok) throw new Error('無法載入書庫列表。');
            const masterList = await listResponse.json();
            
            const bookMeta = masterList.books.find(b => b.slug === bookSlug);
            if (!bookMeta || !bookMeta.meta_path) {
                throw new Error(`在書庫中找不到 slug 為 "${bookSlug}" 的書籍。`);
            }

            // 2. 根據路徑讀取具體的 book.json
            const bookResponse = await fetch(bookMeta.meta_path);
            if (!bookResponse.ok) throw new Error(`無法載入書籍元數據：${bookMeta.meta_path}`);
            const bookData = await bookResponse.json();

            // 3. 渲染頁面內容
            renderBookDetails(bookData);
            renderTableOfContents(bookData.volumes || []);

        } catch (error) {
            console.error('載入書籍頁面失敗:', error);
            displayError(error.message);
        }
    }

    // 渲染書籍的標題、作者和描述
    function renderBookDetails(book) {
        document.title = book.title; // 更新瀏覽器標籤頁標題
        bookTitleEl.textContent = book.title;
        bookAuthorEl.textContent = `作者：${book.author || '未知'}`;
        bookDescriptionEl.textContent = book.description || '暫無簡介。';
    }

    // 渲染目錄
    function renderTableOfContents(volumes) {
        tocContainer.innerHTML = ''; // 清空容器
        if (volumes.length === 0) {
            tocContainer.innerHTML = '<p>本書暫無章節。</p>';
            return;
        }

        volumes.forEach(volume => {
            const volumeSection = document.createElement('div');
            volumeSection.className = 'volume-section';

            const volumeTitle = document.createElement('h2');
            volumeTitle.className = 'volume-title';
            volumeTitle.textContent = volume.title;
            volumeSection.appendChild(volumeTitle);

            const chapterList = document.createElement('ul');
            chapterList.className = 'chapter-list';

            if (volume.chapters && volume.chapters.length > 0) {
                volume.chapters.forEach(chapter => {
                    const chapterItem = document.createElement('li');
                    const link = document.createElement('a');
                    // 連結到閱讀器，並傳遞章節檔案的路徑
                    link.href = `reader.html?path=${encodeURIComponent(chapter.path)}`;
                    link.textContent = chapter.title;
                    chapterItem.appendChild(link);
                    chapterList.appendChild(chapterItem);
                });
            } else {
                const noChaptersItem = document.createElement('li');
                noChaptersItem.textContent = '本卷暫無章節。';
                chapterList.appendChild(noChaptersItem);
            }
            
            volumeSection.appendChild(chapterList);
            tocContainer.appendChild(volumeSection);
        });
    }

    function displayError(message) {
        bookTitleEl.textContent = '錯誤';
        tocContainer.innerHTML = `<p style="color: var(--glow-magenta); text-align: center;">${message}</p>`;
    }

    // --- 程式入口 ---
    createParticles();
    initializeBookPage();
});
