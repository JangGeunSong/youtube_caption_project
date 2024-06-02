// popup.js

document.getElementById('loadButton').addEventListener('click', () => {
    let file = document.getElementById('fileInput').files[0];
    let format = document.getElementById('formatSelect').value;
    if (file) {
        let reader = new FileReader();
        reader.onload = function (e) {
            let content = e.target.result;
            chrome.storage.local.set({ subtitles: content, format: format }, () => {
                alert('Subtitles loaded');
            });
        };
        reader.readAsText(file, 'euc-kr'); // SMI 파일의 인코딩을 euc-kr로 설정
    }
});

// Restore previous subtitles and format if available
chrome.storage.local.get(['subtitles', 'format'], (data) => {
    if (data.subtitles && data.format) {
        document.getElementById('formatSelect').value = data.format;
    }
});
