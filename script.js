// 粒子效果
function createParticles() {
    const particlesContainer = document.querySelector('.particles');
    const particleCount = window.innerWidth < 768 ? 10 : 20;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (4 + Math.random() * 4) + 's';
        particlesContainer.appendChild(particle);
    }
}

// 滑鼠光標效果
const cursorGlow = document.querySelector('.cursor-glow');
if(cursorGlow){
    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = (e.clientX) + 'px';
        cursorGlow.style.top = (e.clientY) + 'px';
    });
}

// 主題切換
let isDarkMode = true; // 默認暗色主題

function toggleTheme() {
    const root = document.documentElement;
    
    if (isDarkMode) {
        // 切換到深藍主題
        root.style.setProperty('--bg-primary', '#0f1419');
        root.style.setProperty('--bg-secondary', '#1a202c');
        root.style.setProperty('--accent-blue', '#2d3748');
        root.style.setProperty('--accent-purple', '#553c9a');
        document.querySelector('.theme-btn').textContent = '◑';
        isDarkMode = false;
    } else {
        // 切換回原暗色主題
        root.style.setProperty('--bg-primary', '#0a0a0f');
        root.style.setProperty('--bg-secondary', '#12121a');
        root.style.setProperty('--accent-blue', '#2d4263');
        root.style.setProperty('--accent-purple', '#3d2f5a');
        document.querySelector('.theme-btn').textContent = '◐';
        isDarkMode = true;
    }
    
    localStorage.setItem('themeMode', isDarkMode ? 'dark' : 'blue');
}

// 載入擴充功能
function loadExtension(extensionName) {
    console.log(`載入擴充: ${extensionName}`);
    document.body.style.filter = 'blur(2px)';
    setTimeout(() => {
        document.body.style.filter = 'none';
        getPath(extensionName).then(path => {
            if(path == null){
                alert("未完成");
            }else{
                window.location.href = path;
            }
        });
    }, 300);
}

// 開啟專案瀏覽器
function openProjectBrowser() {
    console.log('開啟技術實驗室');
    alert('我不記得我有叫claude弄這東西');
}

// 頁面載入初始化
window.addEventListener('DOMContentLoaded', function() {
    createParticles();
    
    // 恢復主題設定
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme === 'blue') {
        toggleTheme();
    }

    // 添加載入動畫
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease';
        document.body.style.opacity = '1';
    }, 100);
});

//獲取專案路徑
async function getPath(extensionName) {
    try {
        const response = await fetch("project-paths.json");

        // 檢查回應是否成功 (例如, HTTP 狀態碼 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json(); // <-- 修正點：加上括號 ()
        console.log(jsonData[extensionName]);
        return jsonData[extensionName];
    } catch (error) {
        console.error("Fetching project paths failed:", error);
        // 根據需求可以回傳 null 或重新拋出錯誤
        return null;
    }
}
