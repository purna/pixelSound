/**
 * Cloud Sync Manager
 * Coordinates synchronization between:
 * - IndexedDB (local offline storage)
 * - Google Drive (cloud storage)
 * 
 * Features:
 * - Automatic sync on changes
 * - Conflict resolution
 * - Offline-first approach
 * - Multi-device sync
 */

class CloudSyncManager {
    constructor(app) {
        this.app = app;
        this.googleDrive = null;
        this.syncInterval = null;
        this.autoSyncEnabled = true;
        this.syncInProgress = false;
        this.lastSyncTime = null;
        
        // Sync queue for offline changes
        this.syncQueue = [];
        
        this.init();
    }

    /**
     * Initialize sync manager
     */
    async init() {
        // Load sync settings
        this.loadSyncSettings();
        
        // Initialize IndexedDB
        await IndexedDBManager.init();
        
        // Set up auto-sync if enabled
        if (this.autoSyncEnabled) {
            this.startAutoSync();
        }

        // Listen for online/offline events
        window.addEventListener('online', () => this.onOnline());
        window.addEventListener('offline', () => this.onOffline());
        
        console.log('Cloud Sync Manager initialized');
    }

    /**
     * Set Google Drive manager instance
     */
    setGoogleDriveManager(googleDriveManager) {
        this.googleDrive = googleDriveManager;
    }

    /**
     * Save song with sync
     */
    async saveSong(songName, songData) {
        try {
            // Always save to IndexedDB first (offline-first)
            const localId = await IndexedDBManager.saveSong(songName, songData);
            console.log('Saved to IndexedDB:', localId);

            // If online and Google Drive is available, sync to cloud
            if (navigator.onLine && this.googleDrive && this.googleDrive.isSignedIn) {
                try {
                    const driveId = await this.googleDrive.saveSongToDrive(songName, songData);
                    
                    // Link local and cloud IDs
                    await this.linkSongIds(localId, driveId);
                    
                    this.showNotification(`"${songName}" saved locally and to Google Drive`, 'success');
                } catch (error) {
                    console.error('Error syncing to cloud:', error);
                    // Add to sync queue for later
                    this.addToSyncQueue('save', { songName, songData, localId });
                    this.showNotification(`"${songName}" saved locally (will sync when online)`, 'info');
                }
            } else {
                // Offline or not signed in - add to sync queue
                this.addToSyncQueue('save', { songName, songData, localId });
                this.showNotification(`"${songName}" saved locally`, 'success');
            }

            return localId;
        } catch (error) {
            console.error('Error saving song:', error);
            this.showNotification('Error saving song: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Load song with sync
     */
    async loadSong(songId, source = 'auto') {
        try {
            // Try IndexedDB first (fastest)
            if (source === 'auto' || source === 'local') {
                const localSong = await IndexedDBManager.getSong(songId);
                if (localSong) {
                    return localSong;
                }
            }

            // If not found locally and online, try Google Drive
            if (source === 'auto' || source === 'cloud') {
                if (navigator.onLine && this.googleDrive && this.googleDrive.isSignedIn) {
                    const cloudSong = await this.googleDrive.downloadSongFromDrive(songId);
                    if (cloudSong) {
                        // Save to local cache
                        await IndexedDBManager.saveSong(cloudSong.name, cloudSong.data);
                        return cloudSong;
                    }
                }
            }

            throw new Error('Song not found');
        } catch (error) {
            console.error('Error loading song:', error);
            throw error;
        }
    }

    /**
     * Sync all songs from cloud to local
     */
    async syncFromCloud() {
        if (!this.googleDrive || !this.googleDrive.isSignedIn) {
            this.showNotification('Please sign in to Google Drive first', 'error');
            return;
        }

        if (this.syncInProgress) {
            this.showNotification('Sync already in progress', 'info');
            return;
        }

        try {
            this.syncInProgress = true;
            this.showNotification('Syncing from Google Drive...', 'info');

            // Get all songs from Google Drive
            const cloudSongs = await this.googleDrive.loadSongsFromDrive();
            
            // Get all local songs
            const localSongs = await IndexedDBManager.getAllSongs();
            const localSongMap = new Map(localSongs.map(s => [s.driveId, s]));

            let downloaded = 0;
            let updated = 0;
            let skipped = 0;

            for (const cloudFile of cloudSongs) {
                const localSong = localSongMap.get(cloudFile.id);

                // Check if we need to download
                const cloudModified = new Date(cloudFile.modifiedTime).getTime();
                
                if (!localSong) {
                    // New song - download it
                    const songData = await this.googleDrive.downloadSongFromDrive(cloudFile.id);
                    if (songData) {
                        const localId = await IndexedDBManager.saveSong(songData.name, songData.data);
                        await this.linkSongIds(localId, cloudFile.id);
                        downloaded++;
                    }
                } else if (cloudModified > localSong.timestamp) {
                    // Cloud version is newer - update local
                    const songData = await this.googleDrive.downloadSongFromDrive(cloudFile.id);
                    if (songData) {
                        await IndexedDBManager.updateSong(localSong.id, songData.data);
                        updated++;
                    }
                } else {
                    skipped++;
                }
            }

            this.lastSyncTime = Date.now();
            this.saveSyncSettings();

            this.showNotification(
                `Sync complete: ${downloaded} new, ${updated} updated, ${skipped} unchanged`,
                'success'
            );
        } catch (error) {
            console.error('Error syncing from cloud:', error);
            this.showNotification('Sync failed: ' + error.message, 'error');
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync all local songs to cloud
     */
    async syncToCloud() {
        if (!this.googleDrive || !this.googleDrive.isSignedIn) {
            this.showNotification('Please sign in to Google Drive first', 'error');
            return;
        }

        if (this.syncInProgress) {
            this.showNotification('Sync already in progress', 'info');
            return;
        }

        try {
            this.syncInProgress = true;
            this.showNotification('Syncing to Google Drive...', 'info');

            // Get all local songs without cloud IDs
            const localSongs = await IndexedDBManager.getAllSongs();
            const songsToUpload = localSongs.filter(song => !song.driveId);

            let uploaded = 0;

            for (const song of songsToUpload) {
                try {
                    const driveId = await this.googleDrive.saveSongToDrive(song.name, song.data);
                    if (driveId) {
                        await this.linkSongIds(song.id, driveId);
                        uploaded++;
                    }
                } catch (error) {
                    console.error('Error uploading song:', song.name, error);
                }
            }

            this.lastSyncTime = Date.now();
            this.saveSyncSettings();

            this.showNotification(
                `Uploaded ${uploaded} songs to Google Drive`,
                'success'
            );
        } catch (error) {
            console.error('Error syncing to cloud:', error);
            this.showNotification('Sync failed: ' + error.message, 'error');
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Full two-way sync
     */
    async fullSync() {
        if (this.syncInProgress) {
            this.showNotification('Sync already in progress', 'info');
            return;
        }

        try {
            this.syncInProgress = true;

            // Process sync queue first
            await this.processSyncQueue();

            // Sync from cloud (download new/updated)
            await this.syncFromCloud();

            // Sync to cloud (upload new)
            await this.syncToCloud();

            this.showNotification('Full sync complete', 'success');
        } catch (error) {
            console.error('Error in full sync:', error);
            this.showNotification('Sync failed: ' + error.message, 'error');
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Add operation to sync queue
     */
    addToSyncQueue(operation, data) {
        this.syncQueue.push({
            operation,
            data,
            timestamp: Date.now()
        });
        this.saveSyncQueue();
    }

    /**
     * Process pending sync queue
     */
    async processSyncQueue() {
        if (!this.googleDrive || !this.googleDrive.isSignedIn || !navigator.onLine) {
            return;
        }

        const queue = [...this.syncQueue];
        this.syncQueue = [];

        for (const item of queue) {
            try {
                if (item.operation === 'save') {
                    const driveId = await this.googleDrive.saveSongToDrive(
                        item.data.songName,
                        item.data.songData
                    );
                    await this.linkSongIds(item.data.localId, driveId);
                } else if (item.operation === 'delete') {
                    if (item.data.driveId) {
                        await this.googleDrive.deleteSongFromDrive(item.data.driveId);
                    }
                }
            } catch (error) {
                console.error('Error processing queue item:', error);
                // Re-add to queue if it failed
                this.syncQueue.push(item);
            }
        }

        this.saveSyncQueue();
    }

    /**
     * Link local and cloud song IDs
     */
    async linkSongIds(localId, driveId) {
        try {
            const song = await IndexedDBManager.getSong(localId);
            if (song) {
                song.driveId = driveId;
                song.syncedAt = Date.now();
                await IndexedDBManager.updateSong(localId, song.data);
            }
        } catch (error) {
            console.error('Error linking song IDs:', error);
        }
    }

    /**
     * Start automatic sync
     */
    startAutoSync(intervalMinutes = 5) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(() => {
            if (navigator.onLine && this.googleDrive && this.googleDrive.isSignedIn) {
                this.fullSync();
            }
        }, intervalMinutes * 60 * 1000);

        console.log(`Auto-sync started (every ${intervalMinutes} minutes)`);
    }

    /**
     * Stop automatic sync
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('Auto-sync stopped');
        }
    }

    /**
     * Toggle auto-sync
     */
    toggleAutoSync(enabled) {
        this.autoSyncEnabled = enabled;
        
        if (enabled) {
            this.startAutoSync();
        } else {
            this.stopAutoSync();
        }
        
        this.saveSyncSettings();
    }

    /**
     * Handle coming online
     */
    async onOnline() {
        console.log('Connection restored - processing sync queue');
        this.showNotification('Back online - syncing...', 'info');
        
        // Wait a bit for connection to stabilize
        setTimeout(() => {
            this.processSyncQueue();
        }, 2000);
    }

    /**
     * Handle going offline
     */
    onOffline() {
        console.log('Connection lost - working offline');
        this.showNotification('Working offline - changes will sync when online', 'info');
    }

    /**
     * Get sync status
     */
    getSyncStatus() {
        return {
            isOnline: navigator.onLine,
            isSignedIn: this.googleDrive ? this.googleDrive.isSignedIn : false,
            autoSyncEnabled: this.autoSyncEnabled,
            syncInProgress: this.syncInProgress,
            queueLength: this.syncQueue.length,
            lastSyncTime: this.lastSyncTime,
            lastSyncTimeFormatted: this.lastSyncTime ? 
                new Date(this.lastSyncTime).toLocaleString() : 'Never'
        };
    }

    /**
     * Save sync settings
     */
    saveSyncSettings() {
        localStorage.setItem('cloudSyncSettings', JSON.stringify({
            autoSyncEnabled: this.autoSyncEnabled,
            lastSyncTime: this.lastSyncTime
        }));
    }

    /**
     * Load sync settings
     */
    loadSyncSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('cloudSyncSettings') || '{}');
            this.autoSyncEnabled = settings.autoSyncEnabled !== false; // Default true
            this.lastSyncTime = settings.lastSyncTime || null;
        } catch (error) {
            console.error('Error loading sync settings:', error);
        }
    }

    /**
     * Save sync queue
     */
    saveSyncQueue() {
        localStorage.setItem('cloudSyncQueue', JSON.stringify(this.syncQueue));
    }

    /**
     * Load sync queue
     */
    loadSyncQueue() {
        try {
            this.syncQueue = JSON.parse(localStorage.getItem('cloudSyncQueue') || '[]');
        } catch (error) {
            console.error('Error loading sync queue:', error);
            this.syncQueue = [];
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (window.songApp && window.songApp.songApp && window.songApp.songApp.showNotification) {
            window.songApp.songApp.showNotification(message, type);
        } else if (this.app && this.app.showNotification) {
            this.app.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Export
window.CloudSyncManager = CloudSyncManager;
