document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookTitle = decodeURIComponent(urlParams.get('title'));

    document.getElementById('book-title').textContent = bookTitle;
    const tocContainer = document.getElementById('table-of-contents');

    fetch('novels-list.json')
        .then(response => response.json())
        .then(books => {
            const bookData = books.find(b => b.title === bookTitle);
            if (!bookData) {
                tocContainer.innerHTML = '<p>找不到這本小說的資訊。</p>';
                return;
            }

            bookData.volumes.forEach(volume => {
                const volumeDiv = document.createElement('div');
                volumeDiv.className = 'volume-section';
                
                const volumeTitle = document.createElement('h2');
                volumeTitle.textContent = volume.title;
                volumeDiv.appendChild(volumeTitle);

                const chapterList = document.createElement('ul');
                volume.chapters.forEach(chapter => {
                    const chapterItem = document.createElement('li');
                    // 將完整的檔案路徑編碼後傳給閱讀器頁面
                    chapterItem.innerHTML = `<a href="reader.html?path=${encodeURIComponent(chapter.path)}">${chapter.title}</a>`;
                    chapterList.appendChild(chapterItem);
                });

                volumeDiv.appendChild(chapterList);
                tocContainer.appendChild(volumeDiv);
            });
        })
        .catch(error => console.error('載入小說目錄失敗:', error));
});