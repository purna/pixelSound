/**
 * Pixel Sound Collection - Audio Search Engine
 * audioSearchEngine.js
 * 
 * Handles:
 *  - Audio file discovery & indexing (from library JSON files)
 *  - Search, filter, sort
 *  - Howler.js playback (play/pause/prev/next/loop/volume)
 *  - Waveform visualisation (canvas)
 *  - Audio details modal (metadata edit, rating, download, copy path)
 *  - Settings (dark mode, compact view, autoplay, volume memory)
 *  - Google Drive links modal
 *  - Google Sheets metadata integration
 *  - Custom tags manager
 *  - Toast notifications
 *  - Persistence via localStorage
 */

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
let audioFiles      = [];        // master list (loaded from JSON files)
let filteredFiles   = [];        // currently filtered results
let displayedFiles  = [];        // currently displayed (paginated)
let currentIndex    = -1;        // index into filteredFiles
let howl            = null;      // active Howler instance
let html5Audio      = null;      // HTML5 audio element for Google Drive files
let isLooping       = false;
let isTryingAlternative = false;  // Flag to prevent recursive error handling
let progressRAF     = null;
let currentModal    = null;      // file shown in details modal
let currentRating   = 0;        // rating in details modal
let waveformDrawn   = false;
let customTags      = [];
let driveLinks      = [];
let sheetsMetadata  = {};        // path → { displayName, tags, description, rating }
let settings = {
    darkMode:           false,
    compactView:        false,
    autoplay:           true,
    rememberVolume:     true,
    showDownloadDialog: false,
    volume:             80,
};

// Pagination settings
const INITIAL_LOAD_LIMIT = 100;
const LOAD_MORE_COUNT = 100;
let currentDisplayLimit = INITIAL_LOAD_LIMIT;
let isLoadingMore = false;

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadCustomTags();
    loadDriveLinks();
    loadSheetsMetadata();
    applySettings();

    // Load audio from library JSON files (H360s and Kenney)
    loadLibraryJsonFiles();

    bindUI();
});

/**
 * Load audio files from Google Sheets CSV
 * This fetches audio file metadata from a published Google Sheets
 */
async function loadLibraryJsonFiles() {
    const loading = document.getElementById('loadingIndicator');
    const countEl = document.getElementById('resultCount');
    
    // Show loading spinner
    loading.classList.remove('hidden');
    countEl.textContent = 'Loading audio libraries...';
    
    // Google Sheets CSV export URL for audio files
    const sheetsCsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTp_bZinlQl9ODTF2MXEmxf-2vLj3sYqtlfOG7lW4zk5_Nfi1HzBuDYlW_kf23aTdr2EjEoACgu0WT9/pub?output=csv';
    
    let loadedFiles = [];
    
    try {
        const response = await fetch(sheetsCsvUrl);
        if (response.ok) {
            const csvText = await response.text();
            const parsed = parseAudioSheetsCsv(csvText);
            
            // Convert Google Drive URLs to playable audio URLs
            loadedFiles = parsed.map((row, idx) => {
                // Convert Drive URL to playable format
                let audioUrl = row.path;
                let driveId = null;
                const driveMatch = row.path.match(/\/d\/([a-zA-Z0-9_-]+)/);
                if (driveMatch) {
                    driveId = driveMatch[1];
                    // Use CORS proxy for Google Drive files
                    // This bypasses CORS restrictions for audio playback
                    audioUrl = getGoogleDriveAudioUrl(driveId);
                }
                
                // Determine format from URL or default to mp3
                let format = 'mp3';
                if (row.path.toLowerCase().includes('.wav')) format = 'wav';
                else if (row.path.toLowerCase().includes('.ogg')) format = 'ogg';
                
                // Use the folder collection name directly as the library name
                let library = row.folderName || 'Other';
                
                return {
                    id: idx + 1,
                    path: audioUrl,
                    originalPath: row.path,
                    driveId: driveId,
                    name: row.name || 'Unknown',
                    category: row.folderName || 'Misc',
                    format: format,
                    size: 0,
                    duration: 0,
                    rating: parseInt(row.rating) || 0,
                    tags: row.tags || [],
                    description: row.description || '',
                    library: library,
                    dateAdded: new Date().toISOString()
                };
            });
        }
    } catch (err) {
        console.log('Could not load from Google Sheets:', err.message);
    }
    
    // If we loaded from sheets, use them
    if (loadedFiles.length > 0) {
        audioFiles = mergeMetadata(loadedFiles);
        filteredFiles = [...audioFiles];
        currentDisplayLimit = INITIAL_LOAD_LIMIT;
        renderGrid();
        updateStats();
        updateLibraryFilter();
        showToast(`✅ Loaded ${audioFiles.length} audio files from Google Sheets`);
    } else {
        // Fallback to local manifest files
        const libraryFiles = [
            'audio/H360s/manifest.json',
            'audio/Kenney/manifest.json',
            'audio/FilmCow/manifest.json',
            'audio/Adobe/manifest.json',
            'audio/Amiga Music/manifest.json',
            'audio/BoomLibrary/manifest.json',
            'audio/XDSoundKit/manifest.json',
            'audio/Other/manifest.json'
        ];
        
        let loadedCount = 0;
        
        for (const libPath of libraryFiles) {
            try {
                const response = await fetch(libPath);
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        // Ensure library tag is set
                        data.forEach(f => {
                            if (!f.library) {
                                if (libPath.includes('H360s')) f.library = 'H360s';
                                else if (libPath.includes('Kenney')) f.library = 'Kenney';
                                else if (libPath.includes('FilmCow')) f.library = 'FilmCow';
                                else if (libPath.includes('Adobe')) f.library = 'Adobe';
                                else if (libPath.includes('Amiga Music')) f.library = 'Amiga Music';
                                else if (libPath.includes('BoomLibrary')) f.library = 'BoomLibrary';
                                else if (libPath.includes('XDSoundKit')) f.library = 'XDSoundKit';
                                else if (libPath.includes('Other')) f.library = 'Other';
                            }
                        });
                        loadedFiles = loadedFiles.concat(data);
                        loadedCount++;
                    }
                }
            } catch (err) {
                console.log(`Could not load ${libPath}:`, err.message);
            }
        }
        
        if (loadedFiles.length > 0) {
            audioFiles = mergeMetadata(loadedFiles);
            filteredFiles = [...audioFiles];
            currentDisplayLimit = INITIAL_LOAD_LIMIT;
            renderGrid();
            updateStats();
            updateLibraryFilter();
            showToast(`✅ Loaded ${audioFiles.length} audio files from ${loadedCount} libraries`);
        } else {
            loading.classList.add('hidden');
            renderGrid();
            updateStats();
        }
    }
}

/**
 * Parse the audio Google Sheets CSV
 */
function parseAudioSheetsCsv(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
    
    return lines.slice(1).map(line => {
        const vals = parseCsvLine(line);
        const row = {};
        headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
        
        // Map column names
        return {
            path: row['file path'] || row['path'] || '',
            name: row['display name'] || row['name'] || '',
            tags: row['tags'] ? row['tags'].split(',').map(t => t.trim()).filter(Boolean) : [],
            description: row['description'] || row['desc'] || '',
            rating: row['rating (1–5)'] || row['rating'] || '0',
            folderName: row['folder collection'] || row['folder name'] || row['folder'] || ''
        };
    }).filter(r => r.path);
}

// ─────────────────────────────────────────────────────────────────────────────
// MERGE SHEETS/LOCAL METADATA INTO FILE LIST
// ─────────────────────────────────────────────────────────────────────────────
function mergeMetadata(files) {
    const saved = loadLocalMetadata();
    return files.map(f => {
        const local  = saved[f.path]  || {};
        const sheets = sheetsMetadata[f.path] || {};
        return {
            ...f,
            name:        sheets.displayName || local.name        || f.name,
            tags:        sheets.tags        || local.tags        || f.tags        || [],
            description: sheets.description || local.description || f.description || '',
            rating:      sheets.rating      !== undefined ? sheets.rating
                       : (local.rating     !== undefined ? local.rating : (f.rating || 0)),
            dateAdded:   f.dateAdded || new Date().toISOString(),
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDERING
// ─────────────────────────────────────────────────────────────────────────────
function renderGrid() {
    const grid     = document.getElementById('resultsGrid');
    const noRes    = document.getElementById('noResults');
    const loading  = document.getElementById('loadingIndicator');
    const countEl  = document.getElementById('resultCount');

    loading.classList.add('hidden');
    
    // Update displayed files based on current limit
    displayedFiles = filteredFiles.slice(0, currentDisplayLimit);
    
    // Update count with "showing X of Y" format
    if (filteredFiles.length > currentDisplayLimit) {
        countEl.textContent = `Showing ${displayedFiles.length} of ${filteredFiles.length} audio files (${audioFiles.length} total)`;
    } else {
        countEl.textContent = `${filteredFiles.length} of ${audioFiles.length} audio files`;
    }

    if (filteredFiles.length === 0) {
        grid.innerHTML = '';
        noRes.classList.remove('hidden');
        hideLoadMoreButton();
        return;
    }
    noRes.classList.add('hidden');

    // Render only displayed files
    grid.innerHTML = displayedFiles.map((f, idx) => buildCard(f, idx)).join('');

    // Attach card event listeners
    grid.querySelectorAll('.audio-card').forEach((card, idx) => {
        card.addEventListener('click', e => {
            // Don't open modal if clicking on buttons or audio player
            if (e.target.closest('.audio-card-btn')) return;
            if (e.target.closest('.audio-player-custom')) return;
            openDetailsModal(displayedFiles[idx]);
        });
    });
    
    // Show/hide load more button
    updateLoadMoreButton();
}

function updateLoadMoreButton() {
    let loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (currentDisplayLimit < filteredFiles.length) {
        if (!loadMoreBtn) {
            // Create load more button
            const resultsSection = document.querySelector('.results-section');
            loadMoreBtn = document.createElement('button');
            loadMoreBtn.id = 'loadMoreBtn';
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More';
            loadMoreBtn.onclick = loadMore;
            resultsSection.appendChild(loadMoreBtn);
        }
        
        const remaining = filteredFiles.length - currentDisplayLimit;
        const nextLoad = Math.min(LOAD_MORE_COUNT, remaining);
        loadMoreBtn.innerHTML = `<i class="fas fa-plus"></i> Load ${nextLoad} More (${remaining} remaining)`;
        loadMoreBtn.classList.remove('hidden');
    } else {
        hideLoadMoreButton();
    }
}

function hideLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.classList.add('hidden');
    }
}

function loadMore() {
    if (isLoadingMore) return;
    isLoadingMore = true;
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        loadMoreBtn.disabled = true;
    }
    
    // Simulate a small delay for better UX
    setTimeout(() => {
        currentDisplayLimit += LOAD_MORE_COUNT;
        renderGrid();
        isLoadingMore = false;
        
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
        }
    }, 100);
}

function buildCard(f, idx) {
    const isPlaying = currentIndex === idx && ((howl && howl.playing()) || (html5Audio && !html5Audio.paused));
    const stars     = buildStarsHtml(f.rating);
    const libraryTag = f.library ? `<span class="audio-tag library-tag">${esc(f.library)}</span>` : '';
    const tags      = (f.tags || []).slice(0, 3).map(t => `<span class="audio-tag">${esc(t)}</span>`).join('');
    const size      = formatBytes(f.size);
    const icon      = categoryIcon(f.category);

    return `
    <div class="audio-card${isPlaying ? ' playing' : ''}" data-id="${f.id}" data-idx="${idx}">
        <div class="audio-card-header">
            <div class="audio-icon"><i class="fas ${icon}"></i></div>
            <div class="audio-info">
                <div class="audio-name" title="${esc(f.name)}">${esc(f.name)}</div>
                <div class="audio-category">
                    <i class="fas fa-folder"></i> ${esc(f.category)}
                </div>
            </div>
        </div>
        <div class="audio-meta">
            <span class="audio-meta-item"><i class="fas fa-file-audio"></i> ${f.format.toUpperCase()}</span>
            <span class="audio-meta-item"><i class="fas fa-hdd"></i> ${size}</span>
            ${f.duration ? `<span class="audio-meta-item"><i class="fas fa-clock"></i> ${formatTime(f.duration)}</span>` : ''}
        </div>
        ${libraryTag || tags ? `<div class="audio-tags">${libraryTag}${tags}</div>` : ''}
        <div class="audio-rating">${stars}</div>
        <div class="audio-player-custom" data-idx="${idx}">
            <button class="audio-play-btn${isPlaying ? ' playing' : ''}" onclick="togglePlay(${idx})" title="${isPlaying ? 'Pause' : 'Play'}">
                <i class="fas fa-${isPlaying ? 'pause' : 'play'}"></i>
            </button>
            <div class="audio-progress-container">
                <div class="audio-progress-bar" onclick="seekAudio(event, ${idx})">
                    <div class="audio-progress-fill${isPlaying ? ' playing' : ''}" style="width: 0%"></div>
                </div>
                <div class="audio-time-display">
                    <span class="audio-current-time">0:00</span>
                    <span class="audio-duration">${f.duration ? formatTime(f.duration) : '0:00'}</span>
                </div>
            </div>
            <button class="audio-volume-btn" onclick="toggleVolumeSlider(this)" title="Volume">
                <i class="fas fa-volume-up"></i>
            </button>
            <div class="audio-volume-slider hidden">
                <input type="range" min="0" max="100" value="${settings.volume}" onchange="setCardVolume(this, ${idx})">
            </div>
        </div>
        <div class="audio-card-actions">
            <button class="audio-card-btn download-btn" onclick="downloadFile(${idx}, event)" title="Download">
                <i class="fas fa-download"></i>
            </button>
            <button class="audio-card-btn" onclick="openDetailsModal(filteredFiles[${idx}])" title="Details">
                <i class="fas fa-info-circle"></i>
            </button>
        </div>
        ${isPlaying ? '<div class="playing-indicator"></div>' : ''}
    </div>`;
}

function buildStarsHtml(rating, interactive = false) {
    return [1,2,3,4,5].map(n => {
        const cls = n <= rating ? 'fas fa-star' : 'far fa-star empty';
        return interactive
            ? `<i class="${cls}" data-rating="${n}" style="cursor:pointer"></i>`
            : `<i class="${cls}"></i>`;
    }).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH & FILTER
// ─────────────────────────────────────────────────────────────────────────────
function applyFilters() {
    const query    = (document.getElementById('searchInput').value || '').toLowerCase().trim();
    const category = document.querySelector('.category-btn.active')?.dataset.category || 'all';
    const format   = document.getElementById('formatFilter').value;
    const library  = document.getElementById('libraryFilter')?.value || 'all';
    const sort     = document.getElementById('sortFilter').value;

    filteredFiles = audioFiles.filter(f => {
        const matchesSearch =
            !query ||
            f.name.toLowerCase().includes(query) ||
            (f.tags || []).some(t => t.toLowerCase().includes(query)) ||
            (f.description || '').toLowerCase().includes(query) ||
            f.path.toLowerCase().includes(query) ||
            (f.library || '').toLowerCase().includes(query);

        const matchesCategory = category === 'all' || f.category === category;
        const matchesFormat   = format   === 'all' || f.format   === format;
        const matchesLibrary  = library  === 'all' || f.library  === library;

        return matchesSearch && matchesCategory && matchesFormat && matchesLibrary;
    });

    // Sort
    filteredFiles.sort((a, b) => {
        switch (sort) {
            case 'name-asc':    return a.name.localeCompare(b.name);
            case 'name-desc':   return b.name.localeCompare(a.name);
            case 'rating-desc': return (b.rating || 0) - (a.rating || 0);
            case 'rating-asc':  return (a.rating || 0) - (b.rating || 0);
            case 'date-desc':   return new Date(b.dateAdded||0) - new Date(a.dateAdded||0);
            case 'date-asc':    return new Date(a.dateAdded||0) - new Date(b.dateAdded||0);
            default:            return 0;
        }
    });

    currentIndex = -1;
    // Reset display limit when filters change
    currentDisplayLimit = INITIAL_LOAD_LIMIT;
    renderGrid();
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYBACK
// ─────────────────────────────────────────────────────────────────────────────
function togglePlay(idx) {
    // If clicking the same file that's currently playing
    if (currentIndex === idx) {
        // For Howler playback
        if (howl) {
            if (howl.playing()) {
                howl.pause();
                setPlayerBtn('play');
            } else {
                howl.play();
                setPlayerBtn('pause');
            }
            return;
        }
        // For HTML5 audio playback
        if (html5Audio && html5Audio.src) {
            if (!html5Audio.paused) {
                html5Audio.pause();
                setPlayerBtn('play');
            } else {
                html5Audio.play().catch(err => {
                    console.log('Playback failed:', err);
                    showToast('⚠️ Could not play audio: ' + (filteredFiles[currentIndex]?.name || 'Unknown'), 3000);
                    setPlayerBtn('play');
                });
                setPlayerBtn('pause');
            }
            return;
        }
    }
    // Load and play new file
    loadAndPlay(idx);
}

function loadAndPlay(idx) {
    // Stop any existing playback
    if (howl) { howl.unload(); howl = null; }
    if (html5Audio) { html5Audio.pause(); html5Audio.src = ''; }
    isTryingAlternative = false;  // Reset flag for new playback
    cancelAnimationFrame(progressRAF);

    const f = filteredFiles[idx];
    if (!f) return;

    currentIndex = idx;

    // For Google Drive files, use HTML5 audio element (better CORS handling)
    if (f.driveId) {
        playWithHtml5Audio(f);
        return;
    }

    // For local files, use Howler.js
    howl = new Howl({
        src:    [f.path],
        html5:  true,
        volume: (settings.volume || 80) / 100,
        loop:   isLooping,
        onplay: () => {
            setPlayerBtn('pause');
            updatePlayerInfo(f);
            tickProgress();
            renderGrid();
        },
        onpause:  () => { setPlayerBtn('play');  cancelAnimationFrame(progressRAF); renderGrid(); },
        onstop:   () => { setPlayerBtn('play');  cancelAnimationFrame(progressRAF); resetProgress(); renderGrid(); },
        onend: () => {
            setPlayerBtn('play');
            cancelAnimationFrame(progressRAF);
            resetProgress();
            renderGrid();
            if (settings.autoplay && !isLooping) playNext();
        },
        onloaderror: (id, err) => {
            console.log('Audio load error:', err, 'for file:', f.name);
            showToast('ℹ️ Could not load audio: ' + f.name, 3000);
            simulateDemoPlayback(f);
        },
        onload: () => {
            f.duration = howl.duration();
        }
    });

    howl.play();
    showPlayerBar(f);
}

/**
 * Play audio using HTML5 audio element (for Google Drive files)
 * Note: Google Drive files have CORS restrictions. We try multiple URL formats.
 */
function playWithHtml5Audio(f) {
    // Create or get the hidden audio element
    if (!html5Audio) {
        html5Audio = document.createElement('audio');
        html5Audio.id = 'html5AudioPlayer';
        html5Audio.style.display = 'none';
        document.body.appendChild(html5Audio);
    }

    // Set up event listeners
    html5Audio.onloadedmetadata = () => {
        f.duration = html5Audio.duration;
        document.getElementById('duration').textContent = formatTime(f.duration);
        // Update card duration
        const card = document.querySelector(`.audio-card[data-idx="${currentIndex}"]`);
        if (card) {
            const durationEl = card.querySelector('.audio-duration');
            if (durationEl) durationEl.textContent = formatTime(f.duration);
        }
    };

    html5Audio.ontimeupdate = () => {
        const seek = html5Audio.currentTime;
        const dur = html5Audio.duration || 1;
        const pct = (seek / dur) * 100;
        
        // Update main player bar
        document.getElementById('progressFill').style.width = pct + '%';
        document.getElementById('currentTime').textContent = formatTime(seek);
        document.getElementById('duration').textContent = formatTime(dur);
        
        // Update card's custom audio player
        const card = document.querySelector(`.audio-card[data-idx="${currentIndex}"]`);
        if (card) {
            const progressFill = card.querySelector('.audio-progress-fill');
            const currentTimeEl = card.querySelector('.audio-current-time');
            const durationEl = card.querySelector('.audio-duration');
            if (progressFill) progressFill.style.width = pct + '%';
            if (currentTimeEl) currentTimeEl.textContent = formatTime(seek);
            if (durationEl) durationEl.textContent = formatTime(dur);
        }
    };

    html5Audio.onended = () => {
        setPlayerBtn('play');
        resetProgress();
        renderGrid();
        if (settings.autoplay && !isLooping) playNext();
    };

    html5Audio.onplay = () => {
        setPlayerBtn('pause');
        renderGrid();
    };

    html5Audio.onpause = () => {
        setPlayerBtn('play');
        renderGrid();
    };

    html5Audio.onerror = (e) => {
        if (isTryingAlternative) return;  // Prevent recursive error handling
        console.log('HTML5 audio error:', e, 'for file:', f.name);
        // Try alternative URL formats for Google Drive
        tryAlternativeGoogleDriveUrls(f, 0);
    };

    // Set source and play - try the direct download URL first
    html5Audio.src = getGoogleDriveDownloadUrl(f.driveId);
    html5Audio.volume = (settings.volume || 80) / 100;
    html5Audio.loop = isLooping;
    
    html5Audio.play().catch(err => {
        if (isTryingAlternative) return;  // Prevent recursive error handling
        console.log('Playback failed:', err);
        // Try alternative URLs instead of immediately giving up
        tryAlternativeGoogleDriveUrls(f, 0);
    });

    showPlayerBar(f);
    updatePlayerInfo(f);
    showToast(`🎵 Playing: ${f.name}`);
}

/**
 * Try alternative Google Drive URL formats for audio playback
 * @param {Object} f - File object
 * @param {number} urlIndex - Index of URL format to try
 */
function tryAlternativeGoogleDriveUrls(f, urlIndex) {
    // Prevent recursive calls
    if (isTryingAlternative && urlIndex === 0) return;
    isTryingAlternative = true;
    
    const urlFormats = [
        // Direct download URL
        () => `https://drive.google.com/uc?export=download&id=${f.driveId}`,
        // Alternative download format
        () => `https://drive.usercontent.google.com/download?id=${f.driveId}&export=download`,
        // Direct file URL (may not work due to CORS)
        () => `https://drive.google.com/file/d/${f.driveId}/view`,
    ];
    
    if (urlIndex >= urlFormats.length) {
        // All URLs failed, try CORS proxy as last resort
        console.log('All direct URLs failed, trying CORS proxy...');
        playWithCorsProxy(f);
        return;
    }
    
    const newUrl = urlFormats[urlIndex]();
    console.log(`Trying alternative URL format ${urlIndex + 1}:`, newUrl);
    
    html5Audio.src = newUrl;
    html5Audio.load();
    html5Audio.play().then(() => {
        // Success - reset the flag
        isTryingAlternative = false;
    }).catch(err => {
        console.log(`URL format ${urlIndex + 1} failed:`, err);
        // Try next URL format
        tryAlternativeGoogleDriveUrls(f, urlIndex + 1);
    });
}

/**
 * Play Google Drive audio using a CORS proxy
 * Fetches the file through a proxy and creates a blob URL for playback
 * @param {Object} f - File object
 */
async function playWithCorsProxy(f) {
    const directUrl = `https://drive.google.com/uc?export=download&id=${f.driveId}`;
    
    // List of CORS proxies to try
    const corsProxies = [
        // Proxy 1: allorigins.win (adds CORS headers)
        (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        // Proxy 2: corsproxy.io
        (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        // Proxy 3: direct with accept header (sometimes works)
        (url) => url,
    ];
    
    for (let i = 0; i < corsProxies.length; i++) {
        const proxyUrl = corsProxies[i](directUrl);
        console.log(`Trying CORS proxy ${i + 1}:`, proxyUrl);
        
        try {
            showToast(`⏳ Loading audio via proxy ${i + 1}...`, 2000);
            
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                console.log(`Proxy ${i + 1} returned HTTP ${response.status}`);
                continue;
            }
            
            // Convert to blob and create object URL
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            console.log(`Proxy ${i + 1} success! Blob size: ${blob.size} bytes`);
            
            // Clean up previous blob URL if exists
            if (html5Audio.src && html5Audio.src.startsWith('blob:')) {
                URL.revokeObjectURL(html5Audio.src);
            }
            
            // Set the blob URL as audio source
            html5Audio.src = blobUrl;
            html5Audio.load();
            
            await html5Audio.play();
            
            isTryingAlternative = false;
            showToast(`🎵 Playing: ${f.name}`);
            return;
            
        } catch (err) {
            console.log(`Proxy ${i + 1} failed:`, err.message);
        }
    }
    
    // All proxies failed, fall back to demo playback
    isTryingAlternative = false;
    showToast('⚠️ Could not load audio. Try downloading instead.', 4000);
    simulateDemoPlayback(f);
}

function simulateDemoPlayback(f) {
    // Show player bar in demo mode with a fake duration
    f.duration = 15 + Math.random() * 45;
    showPlayerBar(f);
    updatePlayerInfo(f);
    setPlayerBtn('pause');

    let elapsed = 0;
    const dur   = f.duration;
    const start = Date.now();

    const tick = () => {
        elapsed = (Date.now() - start) / 1000;
        const pct = Math.min(elapsed / dur, 1);
        document.getElementById('progressFill').style.width = (pct * 100) + '%';
        document.getElementById('currentTime').textContent  = formatTime(elapsed);
        document.getElementById('duration').textContent     = formatTime(dur);
        if (pct < 1) {
            progressRAF = requestAnimationFrame(tick);
        } else {
            setPlayerBtn('play');
            resetProgress();
            renderGrid();
            if (settings.autoplay && !isLooping) playNext();
        }
    };
    progressRAF = requestAnimationFrame(tick);
    renderGrid();
}

function tickProgress() {
    if (!howl || !howl.playing()) return;
    const seek = howl.seek() || 0;
    const dur  = howl.duration() || 1;
    const pct = (seek / dur) * 100;
    
    // Update main player bar
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('currentTime').textContent  = formatTime(seek);
    document.getElementById('duration').textContent     = formatTime(dur);
    
    // Update card's custom audio player
    if (currentIndex >= 0) {
        const card = document.querySelector(`.audio-card[data-idx="${currentIndex}"]`);
        if (card) {
            const progressFill = card.querySelector('.audio-progress-fill');
            const currentTimeEl = card.querySelector('.audio-current-time');
            const durationEl = card.querySelector('.audio-duration');
            if (progressFill) progressFill.style.width = pct + '%';
            if (currentTimeEl) currentTimeEl.textContent = formatTime(seek);
            if (durationEl) durationEl.textContent = formatTime(dur);
        }
    }
    
    progressRAF = requestAnimationFrame(tickProgress);
}

function resetProgress() {
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('currentTime').textContent  = '0:00';
    document.getElementById('duration').textContent     = '0:00';
}

function playNext() {
    if (filteredFiles.length === 0) return;
    // Stop any current playback
    if (howl) { howl.stop(); }
    if (html5Audio) { html5Audio.pause(); }
    const next = (currentIndex + 1) % filteredFiles.length;
    loadAndPlay(next);
}

function playPrev() {
    if (filteredFiles.length === 0) return;
    // Stop any current playback
    if (howl) { howl.stop(); }
    if (html5Audio) { html5Audio.pause(); }
    const prev = (currentIndex - 1 + filteredFiles.length) % filteredFiles.length;
    loadAndPlay(prev);
}

function setPlayerBtn(state) {
    const icon = document.querySelector('#playPauseBtn i');
    if (icon) icon.className = state === 'pause' ? 'fas fa-pause' : 'fas fa-play';
}

function showPlayerBar(f) {
    const bar = document.getElementById('playerBar');
    bar.classList.remove('hidden');
    updatePlayerInfo(f);
}

function updatePlayerInfo(f) {
    document.getElementById('playerTitle').textContent    = f.name;
    document.getElementById('playerCategory').textContent = f.category;
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAILS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function openDetailsModal(f) {
    currentModal  = f;
    currentRating = f.rating || 0;

    document.getElementById('audioDetailsTitle').textContent = f.name;
    document.getElementById('detailFilename').textContent    = f.path.split('/').pop();
    document.getElementById('detailCategory').textContent    = f.category;
    document.getElementById('detailFormat').textContent      = f.format.toUpperCase();
    document.getElementById('detailSize').textContent        = formatBytes(f.size);
    document.getElementById('detailDuration').textContent    = f.duration ? formatTime(f.duration) : 'Unknown';
    document.getElementById('detailDisplayName').value       = f.name;
    document.getElementById('detailTags').value              = (f.tags || []).join(', ');
    document.getElementById('detailDescription').value       = f.description || '';

    // Stars
    renderModalStars(currentRating);

    // Waveform
    drawFakeWaveform(f);

    document.getElementById('audioDetailsModal').classList.remove('hidden');

    // Preview play button
    const previewBtn = document.getElementById('previewPlayBtn');
    previewBtn.innerHTML = '<i class="fas fa-play"></i> Preview';
    previewBtn.onclick = () => {
        const idx = filteredFiles.indexOf(f);
        if (idx !== -1) {
            togglePlay(idx);
            const isPlaying = (howl && howl.playing()) || (html5Audio && !html5Audio.paused);
            previewBtn.innerHTML = isPlaying
                ? '<i class="fas fa-pause"></i> Pause'
                : '<i class="fas fa-play"></i> Preview';
        }
    };
    document.getElementById('previewDuration').textContent = f.duration ? formatTime(f.duration) : '—';
}

function renderModalStars(rating) {
    const container = document.getElementById('detailRating');
    container.innerHTML = buildStarsHtml(rating, true);
    container.querySelectorAll('i[data-rating]').forEach(star => {
        star.addEventListener('click', () => {
            currentRating = parseInt(star.dataset.rating);
            renderModalStars(currentRating);
        });
        star.addEventListener('mouseover', () => renderModalStars(parseInt(star.dataset.rating)));
        star.addEventListener('mouseout',  () => renderModalStars(currentRating));
    });
}

function drawFakeWaveform(f) {
    const canvas = document.getElementById('waveformCanvas');
    const ctx    = canvas.getContext('2d');
    const W = canvas.offsetWidth  || 400;
    const H = canvas.offsetHeight || 80;
    canvas.width  = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    // Seed based on file id for consistency
    const seed = f.id * 137;
    const bars = Math.floor(W / 4);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#f472b6';

    for (let i = 0; i < bars; i++) {
        const rand = pseudoRandom(seed + i);
        const barH = 6 + rand * (H - 12);
        const x = i * 4;
        const y = (H - barH) / 2;
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.3 + rand * 0.7;
        ctx.beginPath();
        ctx.roundRect(x, y, 2, barH, 1);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function pseudoRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function closeDetailsModal() {
    document.getElementById('audioDetailsModal').classList.add('hidden');
    currentModal = null;
}

function saveMetadata() {
    if (!currentModal) return;
    const name  = document.getElementById('detailDisplayName').value.trim();
    const tags  = document.getElementById('detailTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const desc  = document.getElementById('detailDescription').value.trim();

    currentModal.name        = name || currentModal.name;
    currentModal.tags        = tags;
    currentModal.description = desc;
    currentModal.rating      = currentRating;

    // Persist locally
    const all = loadLocalMetadata();
    all[currentModal.path] = { name: currentModal.name, tags, description: desc, rating: currentRating };
    localStorage.setItem('h360_metadata', JSON.stringify(all));

    renderGrid();
    showToast('✅ Metadata saved');
    closeDetailsModal();
}

function loadLocalMetadata() {
    try { return JSON.parse(localStorage.getItem('h360_metadata') || '{}'); }
    catch { return {}; }
}

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD
// ─────────────────────────────────────────────────────────────────────────────
function downloadFile(idx, e) {
    if (e) e.stopPropagation();
    const f = filteredFiles[idx];
    if (!f) return;

    if (settings.showDownloadDialog) {
        if (!confirm(`Download "${f.name}"?\nPath: ${f.path}`)) return;
    }

    // For Google Drive files, use the download URL
    let downloadUrl = f.path;
    if (f.driveId) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${f.driveId}`;
    }

    const a    = document.createElement('a');
    a.href     = downloadUrl;
    a.download = f.name + '.' + f.format;
    a.target = '_blank';
    a.click();
    showToast(`⬇️ Downloading: ${f.name}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem('h360_settings') || '{}');
        settings = { ...settings, ...saved };
    } catch {}
}

function saveSettings() {
    localStorage.setItem('h360_settings', JSON.stringify(settings));
}

function applySettings() {
    if (settings.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    if (settings.compactView) {
        document.querySelector('.results-section')?.classList.add('compact-view');
    } else {
        document.querySelector('.results-section')?.classList.remove('compact-view');
    }
    // Sync checkboxes in settings modal
    const dm  = document.getElementById('darkModeToggle');
    const cv  = document.getElementById('compactViewToggle');
    const ap  = document.getElementById('autoplayToggle');
    const rv  = document.getElementById('rememberVolumeToggle');
    const dd  = document.getElementById('showDownloadDialogToggle');
    if (dm)  dm.checked  = settings.darkMode;
    if (cv)  cv.checked  = settings.compactView;
    if (ap)  ap.checked  = settings.autoplay;
    if (rv)  rv.checked  = settings.rememberVolume;
    if (dd)  dd.checked  = settings.showDownloadDialog;

    // Theme toggle icon
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) themeIcon.className = settings.darkMode ? 'fas fa-sun' : 'fas fa-moon';

    // Volume
    const vol = document.getElementById('volumeSlider');
    if (vol) vol.value = settings.volume;
    if (howl) howl.volume(settings.volume / 100);
    if (html5Audio) html5Audio.volume = settings.volume / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM TAGS
// ─────────────────────────────────────────────────────────────────────────────
function loadCustomTags() {
    try { customTags = JSON.parse(localStorage.getItem('h360_tags') || '[]'); }
    catch { customTags = []; }
}

function saveCustomTags() {
    localStorage.setItem('h360_tags', JSON.stringify(customTags));
}

function renderTagsManager() {
    const container = document.getElementById('tagsManager');
    if (!container) return;
    container.innerHTML = customTags.length
        ? customTags.map((tag, i) => `
            <div class="tag-item">
                <span>${esc(tag)}</span>
                <button onclick="removeTag(${i})" title="Remove"><i class="fas fa-times"></i></button>
            </div>`).join('')
        : '<p style="color:var(--text-secondary);font-size:0.85rem;">No custom tags yet.</p>';
}

function addTag() {
    const input = document.getElementById('newTagInput');
    const tag   = input.value.trim();
    if (!tag || customTags.includes(tag)) return;
    customTags.push(tag);
    saveCustomTags();
    renderTagsManager();
    input.value = '';
}

window.removeTag = function(i) {
    customTags.splice(i, 1);
    saveCustomTags();
    renderTagsManager();
};

// ─────────────────────────────────────────────────────────────────────────────
// DRIVE LINKS
// ─────────────────────────────────────────────────────────────────────────────
function loadDriveLinks() {
    try { driveLinks = JSON.parse(localStorage.getItem('h360_drivelinks') || '[]'); }
    catch { driveLinks = []; }
}

function saveDriveLinks() {
    localStorage.setItem('h360_drivelinks', JSON.stringify(driveLinks));
}

function renderDriveLinks() {
    const container = document.getElementById('driveLinksList');
    if (!container) return;
    container.innerHTML = driveLinks.length
        ? driveLinks.map((link, i) => `
            <div class="drive-link-item">
                <i class="fab fa-google-drive"></i>
                <div class="link-info">
                    <div class="link-name">${esc(link.name)}</div>
                    <div class="link-url">${esc(link.url)}</div>
                </div>
                <div class="link-actions">
                    <button onclick="window.open('${esc(link.url)}','_blank')" title="Open"><i class="fas fa-external-link-alt"></i></button>
                    <button onclick="removeDriveLink(${i})" title="Remove"><i class="fas fa-trash"></i></button>
                </div>
            </div>`).join('')
        : '<p style="color:var(--text-secondary);font-size:0.85rem;">No Drive links added yet.</p>';
}

function addDriveLink() {
    const name = document.getElementById('newDriveName').value.trim();
    const url  = document.getElementById('newDriveUrl').value.trim();
    if (!name || !url) { showToast('⚠️ Please enter both name and URL'); return; }
    driveLinks.push({ name, url });
    saveDriveLinks();
    renderDriveLinks();
    document.getElementById('newDriveName').value = '';
    document.getElementById('newDriveUrl').value  = '';
    showToast('✅ Drive link added');
}

window.removeDriveLink = function(i) {
    driveLinks.splice(i, 1);
    saveDriveLinks();
    renderDriveLinks();
};

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE SHEETS INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────
function loadSheetsMetadata() {
    try { sheetsMetadata = JSON.parse(localStorage.getItem('h360_sheets_meta') || '{}'); }
    catch { sheetsMetadata = {}; }
}

function connectSheets() {
    const url      = document.getElementById('sheetsUrl').value.trim();
    const statusEl = document.getElementById('sheetsStatus');

    if (!url) {
        statusEl.className = 'status-message error';
        statusEl.textContent = '⚠️ Please enter a Google Sheets URL.';
        return;
    }

    // Derive CSV export URL
    // Sheets URL → https://docs.google.com/spreadsheets/d/SHEET_ID/pub?output=csv
    let csvUrl = url;
    try {
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
            csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/pub?output=csv`;
        }
    } catch {}

    statusEl.className = 'status-message';
    statusEl.textContent = '⏳ Connecting to Google Sheets…';

    fetch(csvUrl)
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        })
        .then(csv => {
            const parsed = parseSheetsCsv(csv);
            sheetsMetadata = {};
            parsed.forEach(row => {
                if (row.path) {
                    sheetsMetadata[row.path] = {
                        displayName: row.name || '',
                        tags:        row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                        description: row.description || '',
                        rating:      parseInt(row.rating) || 0,
                    };
                }
            });
            localStorage.setItem('h360_sheets_meta', JSON.stringify(sheetsMetadata));
            audioFiles   = mergeMetadata(audioFiles);
            filteredFiles = [...audioFiles];
            renderGrid();
            updateStats();
            statusEl.className = 'status-message success';
            statusEl.textContent = `✅ Loaded ${parsed.length} records from Sheets.`;
        })
        .catch(err => {
            statusEl.className = 'status-message error';
            statusEl.textContent = `❌ Failed to load: ${err.message}. Make sure the sheet is published (File → Share → Publish to web).`;
        });
}

function parseSheetsCsv(csv) {
    // Simple CSV parser (handles quoted fields)
    const lines  = csv.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
    return lines.slice(1).map(line => {
        const vals = parseCsvLine(line);
        const row  = {};
        headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
        // Map column names: path/filepath, name/displayname, tags, description/desc, rating
        row.path = row['file path'] || row['filepath'] || row['path'] || row['column a'] || '';
        row.name = row['display name'] || row['name'] || row['column b'] || '';
        row.tags = row['tags'] || row['column c'] || '';
        row.description = row['description'] || row['desc'] || row['column d'] || '';
        row.rating = row['rating'] || row['column e'] || '0';
        return row;
    }).filter(r => r.path);
}

function parseCsvLine(line) {
    const result = [];
    let current  = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current); current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

// Export metadata template CSV
function exportMetadataTemplate() {
    const header = 'File Path,Display Name,Tags,Description,Rating';
    const rows   = audioFiles.map(f =>
        `"${f.path}","${f.name}","${(f.tags||[]).join(', ')}","${(f.description||'').replace(/"/g,'""')}","${f.rating||0}"`
    );
    const csv    = [header, ...rows].join('\n');
    downloadText(csv, 'h360_metadata_template.csv', 'text/csv');
    showToast('✅ Template exported');
}

// Import metadata from JSON
function importMetadata() {
    const input = document.createElement('input');
    input.type  = 'file';
    input.accept = '.json,.csv';
    input.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        try {
            if (file.name.endsWith('.csv')) {
                const parsed = parseSheetsCsv(text);
                parsed.forEach(row => {
                    const f = audioFiles.find(f => f.path === row.path);
                    if (f) {
                        f.name        = row.name        || f.name;
                        f.tags        = row.tags        ? row.tags.split(',').map(t=>t.trim()).filter(Boolean) : f.tags;
                        f.description = row.description || f.description;
                        f.rating      = parseInt(row.rating) || f.rating;
                    }
                });
            } else {
                const data = JSON.parse(text);
                // Support array [{path,name,tags,description,rating}]
                (Array.isArray(data) ? data : []).forEach(row => {
                    const f = audioFiles.find(f => f.path === row.path);
                    if (f) { Object.assign(f, row); }
                });
            }
            filteredFiles = [...audioFiles];
            renderGrid();
            showToast('✅ Metadata imported');
        } catch (err) {
            showToast('❌ Import failed: ' + err.message, 4000);
        }
    };
    input.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────
function updateStats() {
    const total     = audioFiles.length;
    const totalSize = audioFiles.reduce((s, f) => s + (f.size || 0), 0);

    const totalEl = document.getElementById('totalAudioFiles');
    const sizeEl  = document.getElementById('totalSize');
    if (totalEl) totalEl.textContent = total;
    if (sizeEl)  sizeEl.textContent  = formatBytes(totalSize);
}

// ─────────────────────────────────────────────────────────────────────────────
// LIBRARY FILTER
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Rebuilds the #libraryFilter <select> options from the current audioFiles list.
 * Preserves the user's current selection if it still exists.
 */
function updateLibraryFilter() {
    const select = document.getElementById('libraryFilter');
    if (!select) return;

    const currentValue = select.value;

    // Collect unique, non-empty library names from the master list
    const libraries = [...new Set(
        audioFiles
            .map(f => f.library)
            .filter(Boolean)
    )].sort();

    // Rebuild options
    select.innerHTML = '<option value="all">All Libraries</option>';
    libraries.forEach(lib => {
        const opt = document.createElement('option');
        opt.value = lib;
        opt.textContent = lib;
        select.appendChild(opt);
    });

    // Restore selection if it still exists
    if ([...select.options].some(o => o.value === currentValue)) {
        select.value = currentValue;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
let toastTimeout = null;
function showToast(msg, duration = 2500) {
    const toast = document.getElementById('toast');
    const label = document.getElementById('toastMessage');
    if (!toast || !label) return;
    label.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.add('hidden'), duration);
}

// ─────────────────────────────────────────────────────────────────────────────
// UI BINDING
// ─────────────────────────────────────────────────────────────────────────────
function bindUI() {

    // ── Search & filters ──────────────────────────────────────────────────────
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('clearSearch').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        applyFilters();
    });
    document.getElementById('formatFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', applyFilters);
    document.getElementById('libraryFilter')?.addEventListener('change', applyFilters);

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });

    // ── Player bar ────────────────────────────────────────────────────────────
    document.getElementById('playPauseBtn').addEventListener('click', () => {
        if (howl) {
            if (howl.playing()) { howl.pause(); setPlayerBtn('play'); }
            else                { howl.play();  setPlayerBtn('pause'); }
        } else if (html5Audio && html5Audio.src) {
            if (!html5Audio.paused) { html5Audio.pause(); setPlayerBtn('play'); }
            else {
                html5Audio.play().catch(err => {
                    console.log('Playback failed:', err);
                    showToast('⚠️ Could not play audio', 3000);
                    setPlayerBtn('play');
                });
                setPlayerBtn('pause');
            }
        } else if (filteredFiles.length > 0) {
            loadAndPlay(0);
        }
    });
    document.getElementById('prevBtn').addEventListener('click', playPrev);
    document.getElementById('nextBtn').addEventListener('click', playNext);

    document.getElementById('progressBar').addEventListener('click', e => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct  = (e.clientX - rect.left) / rect.width;
        
        if (howl) {
            howl.seek(pct * howl.duration());
        } else if (html5Audio && html5Audio.duration) {
            html5Audio.currentTime = pct * html5Audio.duration;
        }
    });

    document.getElementById('volumeSlider').addEventListener('input', e => {
        const vol = parseInt(e.target.value) / 100;
        if (howl) howl.volume(vol);
        if (html5Audio) html5Audio.volume = vol;
        settings.volume = parseInt(e.target.value);
        if (settings.rememberVolume) saveSettings();
    });

    document.getElementById('loopBtn').addEventListener('click', () => {
        isLooping = !isLooping;
        if (howl) howl.loop(isLooping);
        if (html5Audio) html5Audio.loop = isLooping;
        document.getElementById('loopBtn').classList.toggle('active', isLooping);
        showToast(isLooping ? '🔁 Loop on' : '🔁 Loop off');
    });

    document.getElementById('downloadBtn').addEventListener('click', () => {
        if (currentIndex >= 0) downloadFile(currentIndex, null);
    });

    // ── Theme toggle ──────────────────────────────────────────────────────────
    document.getElementById('themeToggle').addEventListener('click', () => {
        settings.darkMode = !settings.darkMode;
        // Sync settings modal checkbox
        const dm = document.getElementById('darkModeToggle');
        if (dm) dm.checked = settings.darkMode;
        saveSettings();
        applySettings();
    });

    // ── Settings modal ────────────────────────────────────────────────────────
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('hidden');
        renderTagsManager();
        applySettings();
    });
    document.getElementById('closeSettings').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('hidden');
    });

    // Settings tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab)?.classList.add('active');
            if (tab.dataset.tab === 'metadata') renderTagsManager();
        });
    });

    // Settings checkboxes
    document.getElementById('darkModeToggle')?.addEventListener('change', e => {
        settings.darkMode = e.target.checked;
        saveSettings(); applySettings();
    });
    document.getElementById('compactViewToggle')?.addEventListener('change', e => {
        settings.compactView = e.target.checked;
        saveSettings(); applySettings(); renderGrid();
    });
    document.getElementById('autoplayToggle')?.addEventListener('change', e => {
        settings.autoplay = e.target.checked;
        saveSettings();
    });
    document.getElementById('rememberVolumeToggle')?.addEventListener('change', e => {
        settings.rememberVolume = e.target.checked;
        saveSettings();
    });
    document.getElementById('showDownloadDialogToggle')?.addEventListener('change', e => {
        settings.showDownloadDialog = e.target.checked;
        saveSettings();
    });

    // ── Metadata tab ──────────────────────────────────────────────────────────
    document.getElementById('connectSheetsBtn')?.addEventListener('click', connectSheets);
    document.getElementById('exportMetadataBtn')?.addEventListener('click', exportMetadataTemplate);
    document.getElementById('importMetadataBtn')?.addEventListener('click', importMetadata);

    // Custom tags
    document.getElementById('addTagBtn')?.addEventListener('click', addTag);
    document.getElementById('newTagInput')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') addTag();
    });

    // ── Drive links modal ─────────────────────────────────────────────────────
    document.getElementById('driveLinksBtn').addEventListener('click', () => {
        renderDriveLinks();
        renderIndexedFolders();
        document.getElementById('driveLinksModal').classList.remove('hidden');
        
        // Check Google auth status
        if (window.GoogleDriveIntegration?.isGoogleAuthenticated()) {
            document.getElementById('driveFolderPicker')?.classList.remove('hidden');
            document.getElementById('googleSignInBtn')?.classList.add('hidden');
            document.getElementById('googleSignOutBtn')?.classList.remove('hidden');
        }
    });
    document.getElementById('closeDriveLinks').addEventListener('click', () => {
        document.getElementById('driveLinksModal').classList.add('hidden');
    });
    document.getElementById('addDriveLinkBtn')?.addEventListener('click', addDriveLink);
    
    // ── Google Drive Integration ──────────────────────────────────────────────
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const googleSignOutBtn = document.getElementById('googleSignOutBtn');
    const browseFoldersBtn = document.getElementById('browseFoldersBtn');
    const indexFolderUrlBtn = document.getElementById('indexFolderUrlBtn');
    const closeFolderPicker = document.getElementById('closeFolderPicker');
    
    googleSignInBtn?.addEventListener('click', () => {
        window.GoogleDriveIntegration?.signInWithGoogle();
    });
    
    googleSignOutBtn?.addEventListener('click', () => {
        window.GoogleDriveIntegration?.signOutFromGoogle();
    });
    
    browseFoldersBtn?.addEventListener('click', () => {
        window.GoogleDriveIntegration?.showFolderPicker();
    });
    
    indexFolderUrlBtn?.addEventListener('click', () => {
        const url = document.getElementById('driveFolderUrl')?.value.trim();
        if (url) {
            window.GoogleDriveIntegration?.indexFolderFromUrl(url);
        } else {
            showToast('⚠️ Please enter a Google Drive folder URL');
        }
    });
    
    closeFolderPicker?.addEventListener('click', () => {
        document.getElementById('driveFolderPickerModal')?.classList.add('hidden');
    });
    
    // Listen for Google auth events
    window.addEventListener('googleAuthSuccess', () => {
        document.getElementById('driveFolderPicker')?.classList.remove('hidden');
        document.getElementById('googleSignInBtn')?.classList.add('hidden');
        document.getElementById('googleSignOutBtn')?.classList.remove('hidden');
        renderIndexedFolders();
    });
    
    window.addEventListener('googleAuthSignOut', () => {
        document.getElementById('driveFolderPicker')?.classList.add('hidden');
        document.getElementById('googleSignInBtn')?.classList.remove('hidden');
        document.getElementById('googleSignOutBtn')?.classList.add('hidden');
    });

    // ── Audio details modal ───────────────────────────────────────────────────
    document.getElementById('closeAudioDetails').addEventListener('click', closeDetailsModal);
    document.getElementById('saveMetadataBtn').addEventListener('click', saveMetadata);
    document.getElementById('downloadAudioBtn').addEventListener('click', () => {
        if (currentModal) downloadFile(filteredFiles.indexOf(currentModal), null);
    });
    document.getElementById('copyPathBtn').addEventListener('click', () => {
        if (!currentModal) return;
        navigator.clipboard.writeText(currentModal.path)
            .then(() => showToast('📋 Path copied!'))
            .catch(() => {
                // Fallback
                const ta = document.createElement('textarea');
                ta.value = currentModal.path;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                showToast('📋 Path copied!');
            });
    });

    // Close modals on backdrop click
    ['settingsModal', 'driveLinksModal', 'audioDetailsModal', 'driveFolderPickerModal', 'indexingProgressModal'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', e => {
            if (e.target.id === id) document.getElementById(id).classList.add('hidden');
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === ' ') {
            e.preventDefault();
            document.getElementById('playPauseBtn').click();
        }
        if (e.key === 'ArrowRight') playNext();
        if (e.key === 'ArrowLeft')  playPrev();
        if (e.key === 'Escape') {
            ['settingsModal','driveLinksModal','audioDetailsModal','driveFolderPickerModal','indexingProgressModal'].forEach(id =>
                document.getElementById(id)?.classList.add('hidden')
            );
        }
    });

    // Compact view applied to results-section parent
    const resultsSection = document.querySelector('.results-section');
    const origApply = applySettings;
    // Patch compact view to target right element
    // Already handled in applySettings → re-run after bind
    applySettings();
}

// Override compact view target to results-grid container
(function patchCompact() {
    const origApply = applySettings;
    // Already applies to .results-section; no change needed.
})();

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a playable Google Drive URL
 * Uses the preview URL for iframe embedding
 */
function getGoogleDriveAudioUrl(driveId) {
    // Use the preview URL for iframe embedding (most reliable)
    return `https://drive.google.com/file/d/${driveId}/preview`;
}

/**
 * Get download URL for Google Drive file
 */
function getGoogleDriveDownloadUrl(driveId) {
    return `https://drive.google.com/uc?export=download&id=${driveId}`;
}

/**
 * Get direct Google Drive URL (may have CORS issues)
 */
function getDirectGoogleDriveUrl(driveId) {
    return `https://drive.google.com/uc?export=download&id=${driveId}`;
}

function categoryIcon(cat) {
    const map = {
        Ambience: 'fa-cloud',
        Combat:   'fa-fist-raised',
        Foley:    'fa-walking',
        Misc:     'fa-box',
        Voices:   'fa-comment',
    };
    return map[cat] || 'fa-music';
}

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(2) + ' GB';
}

function formatTime(secs) {
    const s = Math.floor(secs || 0);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function esc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function downloadText(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Expose functions used inline in HTML template strings
window.togglePlay       = togglePlay;
window.downloadFile     = downloadFile;
window.openDetailsModal = openDetailsModal;
window.filteredFiles    = filteredFiles; // keep reference live
window.seekAudio        = seekAudio;
window.toggleVolumeSlider = toggleVolumeSlider;
window.setCardVolume    = setCardVolume;

/**
 * Seek to position in audio
 */
function seekAudio(e, idx) {
    if (idx !== currentIndex) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    
    // Handle Howler playback
    if (howl) {
        const duration = howl.duration();
        if (duration) {
            howl.seek(pct * duration);
            // Update progress display immediately
            const card = document.querySelector(`.audio-card[data-idx="${idx}"]`);
            if (card) {
                const progressFill = card.querySelector('.audio-progress-fill');
                const currentTimeEl = card.querySelector('.audio-current-time');
                if (progressFill) progressFill.style.width = (pct * 100) + '%';
                if (currentTimeEl) currentTimeEl.textContent = formatTime(pct * duration);
            }
        }
    }
    
    // Handle HTML5 audio playback
    if (html5Audio && html5Audio.duration) {
        html5Audio.currentTime = pct * html5Audio.duration;
        // Update progress display immediately
        const card = document.querySelector(`.audio-card[data-idx="${idx}"]`);
        if (card) {
            const progressFill = card.querySelector('.audio-progress-fill');
            const currentTimeEl = card.querySelector('.audio-current-time');
            if (progressFill) progressFill.style.width = (pct * 100) + '%';
            if (currentTimeEl) currentTimeEl.textContent = formatTime(pct * html5Audio.duration);
        }
    }
}

/**
 * Toggle volume slider visibility
 */
function toggleVolumeSlider(btn) {
    const slider = btn.nextElementSibling;
    if (slider) {
        slider.classList.toggle('hidden');
    }
}

/**
 * Set volume for card audio
 */
function setCardVolume(input, idx) {
    const vol = parseInt(input.value) / 100;
    if (howl && idx === currentIndex) {
        howl.volume(vol);
    }
    if (html5Audio && idx === currentIndex) {
        html5Audio.volume = vol;
    }
    settings.volume = parseInt(input.value);
    if (settings.rememberVolume) saveSettings();
}

// Keep filteredFiles reference updated after filters
const _origRender = renderGrid;
renderGrid = function() {
    window.filteredFiles = filteredFiles;
    _origRender();
};

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE DRIVE INTEGRATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add audio files from external sources (like Google Drive)
 * @param {Array} files - Array of audio file objects to add
 */
window.addAudioFiles = function(files) {
    if (!Array.isArray(files) || files.length === 0) return;
    
    // Filter out duplicates based on path or id
    const existingIds = new Set(audioFiles.map(f => f.id));
    const existingPaths = new Set(audioFiles.map(f => f.path));
    const newFiles = files.filter(f => !existingIds.has(f.id) && !existingPaths.has(f.path));
    
    if (newFiles.length === 0) {
        showToast('ℹ️ All files already in collection');
        return;
    }
    
    // Assign new IDs if needed
    const maxId = Math.max(...audioFiles.map(f => f.id || 0), 0);
    newFiles.forEach((f, i) => {
        if (!f.id) f.id = maxId + i + 1;
    });
    
    audioFiles.push(...newFiles);
    filteredFiles = [...audioFiles];
    applyFilters();
    updateStats();
    
    showToast(`✅ Added ${newFiles.length} audio files to collection`);
};

/**
 * Remove audio files by source
 * @param {string} source - Source identifier (e.g., 'google-drive')
 */
window.removeAudioFilesBySource = function(source) {
    const initialLength = audioFiles.length;
    audioFiles = audioFiles.filter(f => f.source !== source);
    
    if (audioFiles.length < initialLength) {
        filteredFiles = [...audioFiles];
        applyFilters();
        updateStats();
        showToast(`🗑️ Removed ${initialLength - audioFiles.length} files`);
    }
};

/**
 * Render indexed folders list
 */
function renderIndexedFolders() {
    const container = document.getElementById('indexedFoldersList');
    if (!container) return;
    
    const folders = window.GoogleDriveIntegration?.loadIndexedFolders() || [];
    
    if (folders.length === 0) {
        container.innerHTML = '<p class="no-folders">No folders indexed yet.</p>';
        return;
    }
    
    container.innerHTML = folders.map((folder, i) => `
        <div class="indexed-folder-item">
            <div class="folder-info">
                <i class="fas fa-folder"></i>
                <div class="folder-details">
                    <span class="folder-name">${esc(folder.name)}</span>
                    <span class="folder-meta">${folder.fileCount} files • Indexed ${new Date(folder.indexedAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="folder-actions">
                <button class="btn btn-small" onclick="reindexFolder('${folder.id}', '${esc(folder.name)}')" title="Re-index">
                    <i class="fas fa-sync"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="removeIndexedFolder(${i})" title="Remove">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Re-index a folder
 */
window.reindexFolder = async function(folderId, folderName) {
    if (window.GoogleDriveIntegration) {
        await window.GoogleDriveIntegration.indexAndAddFolder(folderId, folderName);
        renderIndexedFolders();
    }
};

/**
 * Remove an indexed folder and its files
 */
window.removeIndexedFolder = function(index) {
    const folders = window.GoogleDriveIntegration?.loadIndexedFolders() || [];
    const folder = folders[index];
    
    if (!folder) return;
    
    // Remove files from collection
    audioFiles = audioFiles.filter(f => f.driveFolderId !== folder.id);
    filteredFiles = [...audioFiles];
    
    // Remove from indexed folders
    folders.splice(index, 1);
    window.GoogleDriveIntegration?.saveIndexedFolders(folders);
    
    // Update Drive audio files storage
    const driveFiles = window.GoogleDriveIntegration?.loadDriveAudioFiles() || [];
    const updatedDriveFiles = driveFiles.filter(f => f.driveFolderId !== folder.id);
    window.GoogleDriveIntegration?.saveDriveAudioFiles(updatedDriveFiles);
    
    renderIndexedFolders();
    applyFilters();
    updateStats();
    showToast(`🗑️ Removed "${folder.name}" and its files`);
};
