/**
 * Google Drive UI Controller
 * Connects UI elements with GoogleDriveManager, IndexedDBManager, and CloudSyncManager
 */

class GoogleDriveUI {
    constructor(app) {
        this.app = app;
        this.googleDrive = null;
        this.syncManager = null;
        
        this.init();
    }

    async init() {
        // Initialize managers
        this.googleDrive = new GoogleDriveManager(this.app);
        this.syncManager = new CloudSyncManager(this.app);
        this.syncManager.setGoogleDriveManager(this.googleDrive);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI
        this.updateStorageStats();
        this.updateSyncStatus();
        
        // Update stats periodically
        setInterval(() => {
            this.updateStorageStats();
            this.updateSyncStatus();
        }, 30000); // Every 30 seconds
        
        // Listen for online/offline events
        window.addEventListener('online', () => this.updateOnlineStatus());
        window.addEventListener('offline', () => this.updateOnlineStatus());
        
        console.log('Google Drive UI initialized');
    }

    setupEventListeners() {
        // Google Sign In/Out
        document.getElementById('googleSignInBtn')?.addEventListener('click', () => {
            this.googleDrive.signIn();
        });

        document.getElementById('googleSignOutBtn')?.addEventListener('click', () => {
            this.googleDrive.signOut();
        });

        // Save to Drive
        document.getElementById('saveToDriveBtn')?.addEventListener('click', async () => {
            const songName = prompt('Enter song name for Google Drive:', 'My Song');
            if (songName) {
                const songData = this.app.getSongData();
                await this.syncManager.saveSong(songName, songData);
            }
        });

        // Load from Drive
        document.getElementById('loadFromDriveBtn')?.addEventListener('click', () => {
            this.showDriveBrowser();
        });

        // Sync to Drive
        document.getElementById('syncToDriveBtn')?.addEventListener('click', async () => {
            await this.syncManager.syncToCloud();
        });

        // Sync from Drive
        document.getElementById('syncFromDriveBtn')?.addEventListener('click', async () => {
            await this.syncManager.syncFromCloud();
        });

        // Full Sync
        document.getElementById('fullSyncBtn')?.addEventListener('click', async () => {
            await this.syncManager.fullSync();
        });

        // Auto-sync Toggle
        document.getElementById('autoSyncToggle')?.addEventListener('change', (e) => {
            this.syncManager.toggleAutoSync(e.target.checked);
        });

        // Local Storage Actions
        document.getElementById('refreshStatsBtn')?.addEventListener('click', () => {
            this.updateStorageStats();
        });

        document.getElementById('exportAllLocalBtn')?.addEventListener('click', async () => {
            await this.exportAllLocal();
        });

        document.getElementById('importToLocalBtn')?.addEventListener('click', () => {
            this.importToLocal();
        });

        document.getElementById('clearLocalStorageBtn')?.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete ALL local songs? This cannot be undone!')) {
                await IndexedDBManager.clearAllSongs();
                this.showNotification('All local songs deleted', 'info');
                this.updateStorageStats();
            }
        });

        // Drive Browser
        document.getElementById('closeDriveBrowser')?.addEventListener('click', () => {
            this.hideDriveBrowser();
        });

        document.getElementById('driveSongSearch')?.addEventListener('input', (e) => {
            this.filterDriveSongs(e.target.value);
        });
    }

    /**
     * Update storage statistics
     */
    async updateStorageStats() {
        try {
            const stats = await IndexedDBManager.getStats();
            const collections = await IndexedDBManager.getAllCollections();

            document.getElementById('totalSongs').textContent = stats.totalSongs;
            document.getElementById('storageUsed').textContent = stats.totalSizeMB + ' MB';
            document.getElementById('totalCollections').textContent = collections.length;
        } catch (error) {
            console.error('Error updating storage stats:', error);
        }
    }

    /**
     * Update sync status
     */
    updateSyncStatus() {
        const status = this.syncManager.getSyncStatus();

        // Online status
        const indicator = document.getElementById('onlineIndicator');
        const connectionStatus = document.getElementById('connectionStatus');
        
        if (status.isOnline) {
            indicator?.classList.remove('offline');
            if (connectionStatus) connectionStatus.textContent = 'Online';
        } else {
            indicator?.classList.add('offline');
            if (connectionStatus) connectionStatus.textContent = 'Offline';
        }

        // Last sync time
        const lastSyncTime = document.getElementById('lastSyncTime');
        if (lastSyncTime) {
            lastSyncTime.textContent = status.lastSyncTimeFormatted;
        }

        // Pending changes
        const pendingChanges = document.getElementById('pendingChanges');
        if (pendingChanges) {
            pendingChanges.textContent = status.queueLength;
        }
    }

    /**
     * Update online status indicator
     */
    updateOnlineStatus() {
        this.updateSyncStatus();
    }

    /**
     * Show Drive Browser Modal
     */
    async showDriveBrowser() {
        const modal = document.getElementById('driveBrowserModal');
        const songList = document.getElementById('driveSongList');
        
        if (!modal || !songList) return;

        modal.classList.remove('hidden');
        songList.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i><br>
                Loading songs from Google Drive...
            </p>
        `;

        try {
            const songs = await this.googleDrive.loadSongsFromDrive();
            this.renderDriveSongs(songs);
        } catch (error) {
            songList.innerHTML = `
                <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #ff5252;"></i><br>
                    Error loading songs: ${error.message}
                </p>
            `;
        }
    }

    /**
     * Hide Drive Browser Modal
     */
    hideDriveBrowser() {
        const modal = document.getElementById('driveBrowserModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * Render Drive songs in browser
     */
    renderDriveSongs(songs) {
        const songList = document.getElementById('driveSongList');
        if (!songList) return;

        if (songs.length === 0) {
            songList.innerHTML = `
                <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    <i class="fas fa-folder-open" style="font-size: 2rem;"></i><br>
                    No songs found in Google Drive
                </p>
            `;
            return;
        }

        songList.innerHTML = songs.map(song => `
            <div class="drive-song-item" data-song-id="${song.id}">
                <div class="drive-song-info">
                    <div class="drive-song-name">
                        <i class="fas fa-music"></i> ${this.extractSongName(song.name)}
                    </div>
                    <div class="drive-song-meta">
                        Modified: ${new Date(song.modifiedTime).toLocaleString()} • 
                        ${this.formatFileSize(song.size)}
                    </div>
                </div>
                <div class="drive-song-actions">
                    <button class="btn btn-secondary" onclick="googleDriveUI.loadDriveSong('${song.id}')">
                        <i class="fas fa-download"></i> Load
                    </button>
                    <button class="btn btn-secondary" onclick="googleDriveUI.deleteDriveSong('${song.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Filter Drive songs by search term
     */
    filterDriveSongs(searchTerm) {
        const items = document.querySelectorAll('.drive-song-item');
        const term = searchTerm.toLowerCase();

        items.forEach(item => {
            const name = item.querySelector('.drive-song-name').textContent.toLowerCase();
            if (name.includes(term)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    /**
     * Load song from Drive
     */
    async loadDriveSong(fileId) {
        try {
            const songData = await this.googleDrive.downloadSongFromDrive(fileId);
            if (songData && songData.data) {
                this.app.loadSongData(songData.data);
                this.showNotification(`Loaded: ${songData.name}`, 'success');
                this.hideDriveBrowser();
            }
        } catch (error) {
            this.showNotification('Error loading song: ' + error.message, 'error');
        }
    }

    /**
     * Delete song from Drive
     */
    async deleteDriveSong(fileId) {
        if (!confirm('Delete this song from Google Drive?')) return;

        try {
            await this.googleDrive.deleteSongFromDrive(fileId);
            
            const songs = await this.googleDrive.loadSongsFromDrive();
            this.renderDriveSongs(songs);
        } catch (error) {
            this.showNotification('Error deleting song: ' + error.message, 'error');
        }
    }

    /**
     * Export all local songs to JSON
     */
    async exportAllLocal() {
        try {
            const jsonData = await IndexedDBManager.exportAllToJSON();
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `song_library_${Date.now()}.json`;
            a.click();

            URL.revokeObjectURL(url);
            this.showNotification('Library exported successfully', 'success');
        } catch (error) {
            this.showNotification('Error exporting library: ' + error.message, 'error');
        }
    }

    /**
     * Import songs to local storage
     */
    importToLocal() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const imported = await IndexedDBManager.importFromJSON(event.target.result);
                    this.showNotification(`Imported ${imported} songs`, 'success');
                    this.updateStorageStats();
                } catch (error) {
                    this.showNotification('Error importing: ' + error.message, 'error');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    /**
     * Extract clean song name from filename
     */
    extractSongName(filename) {
        return filename
            .replace(/_\d+\.json$/, '')
            .replace(/_/g, ' ')
            .trim();
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Helper to show notification
     */
    showNotification(message, type = 'info') {
        if (window.songApp && window.songApp.songApp && window.songApp.songApp.showNotification) {
            window.songApp.songApp.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Export for global access
window.GoogleDriveUI = GoogleDriveUI;
