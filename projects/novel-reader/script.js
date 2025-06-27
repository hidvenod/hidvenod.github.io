document.addEventListener('DOMContentLoaded', () => {
    // Default to dark mode if nothing is set, and apply theme
    isDarkMode = localStorage.getItem('themeMode') !== 'blue';
    applyTheme();
});

let isDarkMode;

function applyTheme() {
    const root = document.documentElement;
    const themeBtn = document.querySelector('.theme-btn');

    if (isDarkMode) {
        // Original dark theme
        root.style.setProperty('--bg-primary', '#0a0a0f');
        root.style.setProperty('--bg-secondary', '#12121a');
        root.style.setProperty('--accent-blue', '#2d4263');
        root.style.setProperty('--accent-purple', '#3d2f5a');
        if (themeBtn) themeBtn.textContent = '◐';
    } else {
        // Deep blue theme
        root.style.setProperty('--bg-primary', '#0f1419');
        root.style.setProperty('--bg-secondary', '#1a202c');
        root.style.setProperty('--accent-blue', '#2d3748');
        root.style.setProperty('--accent-purple', '#553c9a');
        if (themeBtn) themeBtn.textContent = '◑';
    }
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('themeMode', isDarkMode ? 'dark' : 'blue');
    applyTheme();
}

async function getNovelsList(extensionName) {
    try {
        const response = await fetch("./novels/novels-list.json");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        return jsonData[extensionName];
    } catch (error) {
        console.error("Fetching project paths failed:", error);
        return null;
    }
}

async function loadExtension(element, extensionName) {
    const grid = element.closest('.nav-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="card-desc" style="text-align: center; width: 100%;">載入中...</div>';

    const novelList = await getNovelsList(extensionName);

    if (novelList && Array.isArray(novelList) && novelList.length > 0) {
        grid.innerHTML = ''; // Clear loading indicator
        
        novelList.forEach(novel => {
            const novelCard = document.createElement('a');
            novelCard.href = `reader.html?file=${encodeURIComponent(novel.file)}`;
            novelCard.className = 'nav-card';
            novelCard.innerHTML = `
                <div class="card-icon"></div>
                <div class="card-title">${novel.title}</div>
                <div class="card-desc">${novel.author || '點此閱讀'}</div>
            `;
            grid.appendChild(novelCard);
        });
    } else {
        grid.innerHTML = '<p style="text-align: center; width: 100%;">無法載入小說列表或列表為空。</p>';
    }
}
