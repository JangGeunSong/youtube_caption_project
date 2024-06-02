// content.js

function trackCurrentTime() {
    let video = document.querySelector('video');
    if (!video) return;

    /*
    video.addEventListener('timeupdate', () => {
        console.log(`Current time: ${video.currentTime}`);
    });
    */
}

function loadSubtitles(data, format) {
    let subtitles;
    if (format === 'srt') {
        subtitles = parseSRT(data);
    } else if (format === 'smi') {
        subtitles = parseSMI(data);
    }
    displaySubtitles(subtitles);
}

function parseSRT(data) {
    let pattern = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n([\s\S]*?)(?=\n{2,}|\n*$)/g;
    let matches;
    let result = [];

    while ((matches = pattern.exec(data)) !== null) {
        result.push({
            id: matches[1],
            startTime: parseTime(matches[2]),
            endTime: parseTime(matches[3]),
            text: matches[4].replace(/\n/g, '<br>')
        });
    }
    return result;
}

function parseSMI(content) {
    let result = [];
    const syncLines = content.match(/^<Sync\s+Start\s*=\s*\d+[^>]*>.*$/gim);
    const lines = content.split('\n').map(line => line.trim());

    if (syncLines) {
        syncLines.forEach((syncLine, index) => {
            const startMatch = syncLine.match(/^<Sync\s+Start\s*=\s*(\d+)[^>]*>/i);
            const startTime = startMatch ? parseInt(startMatch[1]) / 1000 : null;

            if (startTime) {
                const textLine = lines[lines.indexOf(syncLine) + 1];
                const text = textLine ? textLine.replace(/<br>/gi, '\n').replace(/<\/?[^>]+(>|$)/g, "").trim() : '';

                if (text !== '&nbsp;') {
                    result.push({
                        startTime: startTime,
                        endTime: 0,
                        text: text
                    });
                }
            }
        });

        // Set endTime for each subtitle
        for (let i = 0; i < result.length - 1; i++) {
            result[i].endTime = result[i + 1].startTime;
        }
        result[result.length - 1].endTime = result[result.length - 1].startTime + 4; // Last subtitle duration
    }

    return result;
}

function parseTime(time) {
    let parts = time.split(':');
    let seconds = parseFloat(parts[2].replace(',', '.'));
    let minutes = parseInt(parts[1]);
    let hours = parseInt(parts[0]);
    return (hours * 3600) + (minutes * 60) + seconds;
}

function displaySubtitles(subtitles) {
    let video = document.querySelector('video');
    if (!video) return;

    // 자막을 표시할 요소 찾기
    let captionSegment = document.querySelector('.ytp-caption-segment');
    if (!captionSegment) {
        // 자막 요소가 없다면 생성
        let captionContainer = document.createElement('div');
        captionContainer.className = 'ytp-caption-window-container';
        captionSegment = document.createElement('div');
        captionSegment.className = 'ytp-caption-segment';
        captionContainer.appendChild(captionSegment);
        video.parentNode.appendChild(captionContainer);
    }

    // 자막 표시 업데이트 함수
    function updateSubtitles() {
        let currentTime = video.currentTime;
        let activeSubtitle = subtitles.find(sub => currentTime >= sub.startTime && currentTime <= sub.endTime);
        if (activeSubtitle) {
            captionSegment.innerHTML = activeSubtitle.text;
            captionSegment.style.display = 'block';
        } else {
            captionSegment.style.display = 'none';
        }
    }

    // 동영상 시간 업데이트 시 자막 업데이트
    video.addEventListener('timeupdate', updateSubtitles);
}

// Add style for custom subtitles
function addSubtitleStyle() {
    const style = document.createElement('style');
    style.innerHTML = `
      .ytp-caption-window-container {
        position: absolute;
        bottom: 10%;
        width: 100%;
        text-align: center;
        pointer-events: none;
      }
      .ytp-caption-segment {
        display: inline-block;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 5px;
        border-radius: 5px;
        font-size: 16px;
        max-width: 80%;
        margin: 0 auto;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
}

// Load subtitles from storage when content script is loaded
chrome.storage.local.get(['subtitles', 'format'], (data) => {
    if (data.subtitles && data.format) {
        loadSubtitles(data.subtitles, data.format);
    }
    addSubtitleStyle(); // 스타일 추가
    trackCurrentTime(); // 현재 시간 추적 함수 추가
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.subtitles && changes.format) {
        loadSubtitles(changes.subtitles.newValue, changes.format.newValue);
    }
    addSubtitleStyle(); // 스타일 추가
    trackCurrentTime(); // 현재 시간 추적 함수 추가
});
