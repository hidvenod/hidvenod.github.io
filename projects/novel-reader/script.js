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