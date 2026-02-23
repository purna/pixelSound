/**
 * H360 Sound Collection - Google Drive Integration
 * googleDriveIntegration.js
 * 
 * Handles:
 *  - Google OAuth 2.0 authentication
 *  - Google Drive folder indexing
 *  - Audio file discovery from Drive folders
 *  - Integration with the main audio search engine
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_DRIVE_CONFIG = {
    // Replace with your own Google Cloud Console OAuth Client ID
    // Instructions: https://console.cloud.google.com/apis/credentials
    CLIENT_ID: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
    
    // API key for Drive API (optional, for public file access)
    API_KEY: 'YOUR_API_KEY_HERE',
    
    // Scopes needed for Drive access
    SCOPES: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
    ],
    
    // Supported audio file extensions
    AUDIO_EXTENSIONS: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma', '.aiff'],
    
    // Discovery docs for Drive API
    DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
};

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
let googleAuth = null;
let googleUser = null;
let driveApiLoaded = false;
let gisLoaded = false;
let tokenClient = null;
let accessToken = null;

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load Google Identity Services and Drive API
 * Call this on page load
 */
function loadGoogleAPIs() {
    return new Promise((resolve, reject) => {
        // Load Google Identity Services (GIS)
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.async = true;
        gisScript.defer = true;
        gisScript.onload = () => {
            gisLoaded = true;
            checkAllLoaded(resolve);
        };
        gisScript.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(gisScript);

        // Load Google API client
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.async = true;
        gapiScript.defer = true;
        gapiScript.onload = () => {
            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        discoveryDocs: GOOGLE_DRIVE_CONFIG.DISCOVERY_DOCS
                    });
                    driveApiLoaded = true;
                    checkAllLoaded(resolve);
                } catch (err) {
                    reject(err);
                }
            });
        };
        gapiScript.onerror = () => reject(new Error('Failed to load Google API client'));
        document.head.appendChild(gapiScript);
    });
}

function checkAllLoaded(callback) {
    if (gisLoaded && driveApiLoaded) {
        callback();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialize the token client for OAuth
 */
function initTokenClient() {
    if (!gisLoaded) {
        console.error('Google Identity Services not loaded');
        return false;
    }

    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
            scope: GOOGLE_DRIVE_CONFIG.SCOPES.join(' '),
            callback: (response) => {
                if (response.error !== undefined) {
                    console.error('OAuth error:', response);
                    handleAuthError(response);
                    return;
                }
                accessToken = response.access_token;
                gapi.client.setToken({ access_token: accessToken });
                onAuthSuccess();
            },
        });
        return true;
    } catch (err) {
        console.error('Failed to init token client:', err);
        return false;
    }
}

/**
 * Start the Google Sign-In flow
 */
function signInWithGoogle() {
    if (!tokenClient) {
        if (!initTokenClient()) {
            showToast('❌ Google Sign-In not configured. Please set up OAuth Client ID.', 5000);
            return;
        }
    }

    // Check if already signed in
    if (accessToken) {
        onAuthSuccess();
        return;
    }

    // Request access token
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

/**
 * Sign out from Google
 */
function signOutFromGoogle() {
    if (accessToken && gisLoaded) {
        google.accounts.oauth2.revoke(accessToken, () => {
            accessToken = null;
            gapi.client.setToken(null);
            onSignOut();
        });
    } else {
        accessToken = null;
        onSignOut();
    }
}

/**
 * Handle successful authentication
 */
function onAuthSuccess() {
    console.log('Google authentication successful');
    updateAuthUI(true);
    showToast('✅ Signed in to Google Drive');
    
    // Dispatch custom event for other parts of the app
    window.dispatchEvent(new CustomEvent('googleAuthSuccess'));
}

/**
 * Handle sign out
 */
function onSignOut() {
    updateAuthUI(false);
    showToast('👋 Signed out from Google Drive');
    window.dispatchEvent(new CustomEvent('googleAuthSignOut'));
}

/**
 * Handle authentication errors
 */
function handleAuthError(error) {
    console.error('Authentication error:', error);
    let message = '❌ Authentication failed';
    
    if (error.error === 'access_denied') {
        message = '❌ Access denied. Please allow the app to access your Google Drive.';
    } else if (error.error === 'invalid_client') {
        message = '❌ Invalid OAuth client. Please configure your Google Cloud credentials.';
    }
    
    showToast(message, 5000);
    updateAuthUI(false);
}

/**
 * Update UI elements based on auth state
 */
function updateAuthUI(isSignedIn) {
    const signInBtn = document.getElementById('googleSignInBtn');
    const signOutBtn = document.getElementById('googleSignOutBtn');
    const userInfo = document.getElementById('googleUserInfo');
    const folderPicker = document.getElementById('driveFolderPicker');
    
    if (signInBtn) signInBtn.classList.toggle('hidden', isSignedIn);
    if (signOutBtn) signOutBtn.classList.toggle('hidden', !isSignedIn);
    if (folderPicker) folderPicker.classList.toggle('hidden', !isSignedIn);
    
    if (isSignedIn && userInfo) {
        // Try to get user info
        getUserInfo().then(info => {
            userInfo.innerHTML = `
                <div class="user-info">
                    <img src="${info.picture || ''}" alt="Profile" class="user-avatar">
                    <span class="user-name">${info.name || 'User'}</span>
                </div>
            `;
            userInfo.classList.remove('hidden');
        }).catch(() => {
            userInfo.classList.add('hidden');
        });
    } else if (userInfo) {
        userInfo.classList.add('hidden');
    }
}

/**
 * Get current user info from Google
 */
async function getUserInfo() {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return await response.json();
    } catch (err) {
        console.error('Failed to get user info:', err);
        return {};
    }
}

/**
 * Check if user is authenticated
 */
function isGoogleAuthenticated() {
    return !!accessToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// DRIVE FOLDER OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List folders in Google Drive (for folder picker)
 */
async function listDriveFolders(pageSize = 100, pageToken = null) {
    if (!accessToken) {
        throw new Error('Not authenticated');
    }

    try {
        let query = {
            q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            pageSize: pageSize,
            fields: 'nextPageToken, files(id, name, parents)',
            orderBy: 'name'
        };
        
        if (pageToken) {
            query.pageToken = pageToken;
        }

        const response = await gapi.client.drive.files.list(query);
        return response.result;
    } catch (err) {
        console.error('Failed to list folders:', err);
        throw err;
    }
}

/**
 * Index all audio files in a specific folder (recursive)
 * @param {string} folderId - Google Drive folder ID
 * @param {string} folderName - Display name for the folder
 * @param {function} onProgress - Progress callback (current, total, fileName)
 */
async function indexDriveFolder(folderId, folderName, onProgress = null) {
    if (!accessToken) {
        throw new Error('Not authenticated');
    }

    const audioFiles = [];
    let totalProcessed = 0;

    async function scanFolder(folderId, path = '') {
        let pageToken = null;
        
        do {
            try {
                const response = await gapi.client.drive.files.list({
                    q: `'${folderId}' in parents and trashed = false`,
                    pageSize: 100,
                    pageToken: pageToken,
                    fields: 'nextPageToken, files(id, name, mimeType, size, fileExtension, createdTime, modifiedTime, webContentLink, webViewLink)',
                    orderBy: 'name'
                });

                const files = response.result.files || [];
                
                for (const file of files) {
                    totalProcessed++;
                    
                    if (onProgress) {
                        onProgress(totalProcessed, null, file.name);
                    }

                    // Check if it's a folder - recurse
                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                        await scanFolder(file.id, path + '/' + file.name);
                    }
                    // Check if it's an audio file
                    else if (isAudioFile(file.name)) {
                        const audioFile = {
                            id: `drive_${file.id}`,
                            path: `drive://${file.id}/${file.name}`,
                            name: file.name.replace(/\.[^/.]+$/, ''),
                            originalName: file.name,
                            category: folderName || 'Google Drive',
                            subcategory: path.split('/').filter(Boolean).join(' > ') || '',
                            format: file.fileExtension || getFileExtension(file.name),
                            size: parseInt(file.size) || 0,
                            duration: 0,
                            rating: 0,
                            tags: ['google-drive'],
                            description: `From Google Drive: ${folderName}${path}`,
                            dateAdded: file.createdTime || new Date().toISOString(),
                            driveId: file.id,
                            driveFolderId: folderId,
                            driveLink: file.webViewLink,
                            downloadUrl: file.webContentLink,
                            isGoogleDrive: true
                        };
                        audioFiles.push(audioFile);
                    }
                }

                pageToken = response.result.nextPageToken;
            } catch (err) {
                console.error('Error scanning folder:', err);
                throw err;
            }
        } while (pageToken);
    }

    await scanFolder(folderId, '');
    
    return audioFiles;
}

/**
 * Get folder info by ID
 */
async function getFolderInfo(folderId) {
    if (!accessToken) {
        throw new Error('Not authenticated');
    }

    try {
        const response = await gapi.client.drive.files.get({
            fileId: folderId,
            fields: 'id, name, createdTime, modifiedTime'
        });
        return response.result;
    } catch (err) {
        console.error('Failed to get folder info:', err);
        throw err;
    }
}

/**
 * Extract folder ID from Google Drive URL
 */
function extractFolderId(url) {
    // Handle various Google Drive URL formats
    const patterns = [
        /\/folders\/([a-zA-Z0-9-_]+)/,
        /id=([a-zA-Z0-9-_]+)/,
        /\/d\/([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    // If it's just an ID
    if (/^[a-zA-Z0-9-_]+$/.test(url)) {
        return url;
    }

    return null;
}

/**
 * Check if file is an audio file based on extension
 */
function isAudioFile(filename) {
    const ext = getFileExtension(filename).toLowerCase();
    return GOOGLE_DRIVE_CONFIG.AUDIO_EXTENSIONS.includes('.' + ext);
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop() : '';
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION WITH MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add Google Drive files to the main audio collection
 */
function addDriveFilesToCollection(files) {
    if (typeof window.addAudioFiles === 'function') {
        window.addAudioFiles(files);
    } else {
        // Direct integration with audioSearchEngine.js
        if (typeof audioFiles !== 'undefined') {
            // Filter out duplicates
            const existingIds = new Set(audioFiles.map(f => f.id));
            const newFiles = files.filter(f => !existingIds.has(f.id));
            
            audioFiles.push(...newFiles);
            filteredFiles = [...audioFiles];
            
            if (typeof renderGrid === 'function') renderGrid();
            if (typeof updateStats === 'function') updateStats();
        }
    }
}

/**
 * Save indexed Drive folders to localStorage
 */
function saveIndexedFolders(folders) {
    localStorage.setItem('h360_indexed_folders', JSON.stringify(folders));
}

/**
 * Load indexed Drive folders from localStorage
 */
function loadIndexedFolders() {
    try {
        return JSON.parse(localStorage.getItem('h360_indexed_folders') || '[]');
    } catch {
        return [];
    }
}

/**
 * Save Drive audio files to localStorage
 */
function saveDriveAudioFiles(files) {
    localStorage.setItem('h360_drive_audio_files', JSON.stringify(files));
}

/**
 * Load Drive audio files from localStorage
 */
function loadDriveAudioFiles() {
    try {
        return JSON.parse(localStorage.getItem('h360_drive_audio_files') || '[]');
    } catch {
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Show a folder picker dialog
 */
async function showFolderPicker() {
    const modal = document.getElementById('driveFolderPickerModal');
    const listContainer = document.getElementById('folderPickerList');
    
    if (!modal || !listContainer) {
        console.error('Folder picker modal not found');
        return null;
    }

    // Show loading state
    listContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading folders...</div>';
    modal.classList.remove('hidden');

    try {
        const result = await listDriveFolders();
        
        if (!result.files || result.files.length === 0) {
            listContainer.innerHTML = '<p class="no-folders">No folders found in your Google Drive.</p>';
            return null;
        }

        listContainer.innerHTML = result.files.map(folder => `
            <div class="folder-item" data-folder-id="${folder.id}" data-folder-name="${esc(folder.name)}">
                <i class="fas fa-folder"></i>
                <span class="folder-name">${esc(folder.name)}</span>
                <button class="btn-select-folder" title="Select this folder">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        `).join('');

        // Attach click handlers
        listContainer.querySelectorAll('.folder-item').forEach(item => {
            item.querySelector('.btn-select-folder').addEventListener('click', () => {
                const folderId = item.dataset.folderId;
                const folderName = item.dataset.folderName;
                modal.classList.add('hidden');
                indexAndAddFolder(folderId, folderName);
            });
        });

    } catch (err) {
        listContainer.innerHTML = `<p class="error">Failed to load folders: ${err.message}</p>`;
    }
}

/**
 * Index a folder and add its contents to the app
 */
async function indexAndAddFolder(folderId, folderName) {
    showToast(`📁 Indexing "${folderName}"...`, 3000);
    
    // Show progress modal
    const progressModal = document.getElementById('indexingProgressModal');
    const progressBar = document.getElementById('indexingProgressBar');
    const progressText = document.getElementById('indexingProgressText');
    
    if (progressModal) {
        progressModal.classList.remove('hidden');
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = 'Starting...';
    }

    try {
        const files = await indexDriveFolder(folderId, folderName, (current, total, fileName) => {
            if (progressBar) progressBar.style.width = '50%';
            if (progressText) progressText.textContent = `Scanning: ${fileName}`;
        });

        if (files.length === 0) {
            showToast('ℹ️ No audio files found in this folder', 4000);
            if (progressModal) progressModal.classList.add('hidden');
            return;
        }

        // Update progress
        if (progressBar) progressBar.style.width = '75%';
        if (progressText) progressText.textContent = `Found ${files.length} audio files. Adding to collection...`;

        // Add files to collection
        addDriveFilesToCollection(files);

        // Save to localStorage
        const indexedFolders = loadIndexedFolders();
        indexedFolders.push({
            id: folderId,
            name: folderName,
            indexedAt: new Date().toISOString(),
            fileCount: files.length
        });
        saveIndexedFolders(indexedFolders);
        saveDriveAudioFiles(loadDriveAudioFiles().concat(files));

        // Complete
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = `Complete! Added ${files.length} audio files.`;
        
        setTimeout(() => {
            if (progressModal) progressModal.classList.add('hidden');
        }, 1500);

        showToast(`✅ Added ${files.length} audio files from "${folderName}"`, 5000);

    } catch (err) {
        if (progressModal) progressModal.classList.add('hidden');
        showToast(`❌ Failed to index folder: ${err.message}`, 5000);
        console.error('Indexing error:', err);
    }
}

/**
 * Index a folder from URL input
 */
async function indexFolderFromUrl(url) {
    const folderId = extractFolderId(url);
    
    if (!folderId) {
        showToast('⚠️ Invalid Google Drive folder URL', 4000);
        return;
    }

    try {
        const folderInfo = await getFolderInfo(folderId);
        await indexAndAddFolder(folderId, folderInfo.name);
    } catch (err) {
        showToast(`❌ Failed to access folder: ${err.message}`, 5000);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function esc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// showToast is defined in audioSearchEngine.js, but provide fallback
if (typeof showToast !== 'function') {
    window.showToast = function(msg, duration = 2500) {
        console.log('Toast:', msg);
        const toast = document.getElementById('toast');
        const label = document.getElementById('toastMessage');
        if (toast && label) {
            label.textContent = msg;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), duration);
        }
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────
window.GoogleDriveIntegration = {
    // Initialization
    loadGoogleAPIs,
    initTokenClient,
    
    // Authentication
    signInWithGoogle,
    signOutFromGoogle,
    isGoogleAuthenticated,
    
    // Folder operations
    listDriveFolders,
    indexDriveFolder,
    getFolderInfo,
    extractFolderId,
    indexFolderFromUrl,
    
    // UI
    showFolderPicker,
    indexAndAddFolder,
    
    // Data persistence
    saveIndexedFolders,
    loadIndexedFolders,
    saveDriveAudioFiles,
    loadDriveAudioFiles,
    
    // Integration
    addDriveFilesToCollection
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Load Google APIs
    loadGoogleAPIs()
        .then(() => {
            console.log('Google APIs loaded successfully');
            initTokenClient();
            
            // Load previously indexed files
            const savedFiles = loadDriveAudioFiles();
            if (savedFiles.length > 0) {
                addDriveFilesToCollection(savedFiles);
                console.log(`Loaded ${savedFiles.length} previously indexed Drive files`);
            }
        })
        .catch(err => {
            console.warn('Failed to load Google APIs:', err);
        });
});
