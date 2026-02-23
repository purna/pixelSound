/**
 * Google Drive Integration for Song Designer
 * Features:
 * - Google Sign-In with OAuth 2.0
 * - Save songs directly to Google Drive folder
 * - IndexedDB for large local song libraries
 * - Cloud sync for multi-device access
 */

class GoogleDriveManager {
    constructor(app) {
        this.app = app;
        this.isSignedIn = false;
        this.user = null;
        this.accessToken = null;
        this.FOLDER_NAME = 'Song Designer Files';
        this.folderId = null;
        
        // Google API configuration - Replace with your credentials
        this.CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
        this.API_KEY = 'YOUR_API_KEY';
        this.DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
        
        // Check if credentials are configured
        this.credentialsConfigured = this.CLIENT_ID !== 'YOUR_CLIENT_ID.apps.googleusercontent.com' && 
                                     this.API_KEY !== 'YOUR_API_KEY';
        
        // Only initialize if credentials are configured
        if (this.credentialsConfigured) {
            this.initializeGoogleAPI();
        } else {
            console.log('Google Drive credentials not configured. Skipping initialization.');
        }
    }

    /**
     * Initialize Google API
     */
    async initializeGoogleAPI() {
        try {
            // Load Google API client
            await this.loadGoogleScript();
            
            // Initialize the Google API client
            await gapi.load('client:auth2', () => {
                this.initClient();
            });
        } catch (error) {
            console.error('Error loading Google API:', error);
            this.showNotification('Failed to load Google Drive integration', 'error');
        }
    }

    /**
     * Load Google API script dynamically
     */
    loadGoogleScript() {
        return new Promise((resolve, reject) => {
            if (typeof gapi !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    /**
     * Initialize Google API client
     */
    async initClient() {
        // Check if gapi is available
        if (typeof gapi === 'undefined') {
            console.log('Google API not loaded. Google Drive features disabled.');
            return;
        }
        
        // Check if credentials are configured
        if (!this.credentialsConfigured) {
            console.log('Google Drive credentials not configured. Skipping initialization.');
            return;
        }
        
        try {
            await gapi.client.init({
                apiKey: this.API_KEY,
                clientId: this.CLIENT_ID,
                discoveryDocs: this.DISCOVERY_DOCS,
                scope: this.SCOPES
            });

            // Listen for sign-in state changes
            gapi.auth2.getAuthInstance().isSignedIn.listen((isSignedIn) => {
                this.updateSignInStatus(isSignedIn);
            });

            // Handle the initial sign-in state
            this.updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            
            console.log('Google Drive API initialized');
        } catch (error) {
            // Suppress expected errors when not configured
            if (error.message?.includes('idpiframe_initialization_failed') || 
                error.message?.includes('Not a valid origin')) {
                console.log('Google Drive: Credentials not configured or origin not authorized.');
                console.log('To enable Google Drive, configure CLIENT_ID and API_KEY in googleDriveManager.js');
            } else {
                console.error('Error initializing Google API client:', error);
            }
        }
    }

    /**
     * Update sign-in status
     */
    updateSignInStatus(isSignedIn) {
        this.isSignedIn = isSignedIn;
        
        if (isSignedIn) {
            this.user = gapi.auth2.getAuthInstance().currentUser.get();
            const profile = this.user.getBasicProfile();
            
            this.showNotification(`Signed in as ${profile.getName()}`, 'success');
            this.updateUI(true, profile);
            
            // Get or create the Song Designer folder
            this.ensureSongDesignerFolder();
        } else {
            this.user = null;
            this.accessToken = null;
            this.folderId = null;
            this.updateUI(false);
        }
    }

    /**
     * Sign in to Google
     */
    async signIn() {
        try {
            await gapi.auth2.getAuthInstance().signIn();
        } catch (error) {
            console.error('Error signing in:', error);
            this.showNotification('Sign-in failed: ' + error.message, 'error');
        }
    }

    /**
     * Sign out from Google
     */
    async signOut() {
        try {
            await gapi.auth2.getAuthInstance().signOut();
            this.showNotification('Signed out successfully', 'info');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }

    /**
     * Ensure Song Designer folder exists in Google Drive
     */
    async ensureSongDesignerFolder() {
        try {
            // Search for existing folder
            const response = await gapi.client.drive.files.list({
                q: `name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.result.files && response.result.files.length > 0) {
                // Folder exists
                this.folderId = response.result.files[0].id;
                console.log('Found existing folder:', this.folderId);
            } else {
                // Create new folder
                const folderMetadata = {
                    name: this.FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder'
                };

                const folder = await gapi.client.drive.files.create({
                    resource: folderMetadata,
                    fields: 'id'
                });

                this.folderId = folder.result.id;
                console.log('Created new folder:', this.folderId);
                this.showNotification('Created "Song Designer Files" folder in Google Drive', 'success');
            }
        } catch (error) {
            console.error('Error ensuring folder exists:', error);
            this.showNotification('Error accessing Google Drive folder', 'error');
        }
    }

    /**
     * Save song to Google Drive
     */
    async saveSongToDrive(songName, songData) {
        if (!this.isSignedIn) {
            this.showNotification('Please sign in to Google first', 'error');
            return false;
        }

        if (!this.folderId) {
            await this.ensureSongDesignerFolder();
            if (!this.folderId) {
                this.showNotification('Could not access Google Drive folder', 'error');
                return false;
            }
        }

        try {
            const fileName = `${songName.replace(/\s+/g, '_')}_${Date.now()}.json`;
            
            const exportData = {
                version: '1.0',
                timestamp: Date.now(),
                name: songName,
                data: songData
            };

            const fileContent = JSON.stringify(exportData, null, 2);
            const blob = new Blob([fileContent], { type: 'application/json' });

            // Create file metadata
            const metadata = {
                name: fileName,
                mimeType: 'application/json',
                parents: [this.folderId]
            };

            // Upload file using multipart request
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', blob);

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({ 
                    'Authorization': 'Bearer ' + gapi.auth.getToken().access_token 
                }),
                body: form
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification(`"${songName}" saved to Google Drive`, 'success');
                
                // Also save to IndexedDB for offline access
                await this.saveToIndexedDB(songName, exportData);
                
                return result.id;
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Error saving to Google Drive:', error);
            this.showNotification('Error saving to Google Drive: ' + error.message, 'error');
            
            // Fallback to IndexedDB only
            await this.saveToIndexedDB(songName, exportData);
            return false;
        }
    }

    /**
     * Load songs from Google Drive
     */
    async loadSongsFromDrive() {
        if (!this.isSignedIn) {
            this.showNotification('Please sign in to Google first', 'error');
            return [];
        }

        if (!this.folderId) {
            await this.ensureSongDesignerFolder();
            if (!this.folderId) return [];
        }

        try {
            const response = await gapi.client.drive.files.list({
                q: `'${this.folderId}' in parents and mimeType='application/json' and trashed=false`,
                fields: 'files(id, name, modifiedTime, size)',
                orderBy: 'modifiedTime desc',
                pageSize: 100
            });

            const files = response.result.files || [];
            this.showNotification(`Found ${files.length} songs in Google Drive`, 'success');
            
            return files;
        } catch (error) {
            console.error('Error loading from Google Drive:', error);
            this.showNotification('Error loading from Google Drive: ' + error.message, 'error');
            return [];
        }
    }

    /**
     * Download specific song from Google Drive
     */
    async downloadSongFromDrive(fileId) {
        try {
            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            const songData = JSON.parse(response.body);
            
            // Save to IndexedDB for offline access
            await this.saveToIndexedDB(songData.name, songData);
            
            return songData;
        } catch (error) {
            console.error('Error downloading song:', error);
            this.showNotification('Error downloading song: ' + error.message, 'error');
            return null;
        }
    }

    /**
     * Delete song from Google Drive
     */
    async deleteSongFromDrive(fileId) {
        if (!this.isSignedIn) {
            this.showNotification('Please sign in to Google first', 'error');
            return false;
        }

        try {
            await gapi.client.drive.files.delete({
                fileId: fileId
            });

            this.showNotification('Song deleted from Google Drive', 'success');
            return true;
        } catch (error) {
            console.error('Error deleting from Google Drive:', error);
            this.showNotification('Error deleting from Google Drive: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Update UI based on sign-in status
     */
    updateUI(isSignedIn, profile = null) {
        const signInBtn = document.getElementById('googleSignInBtn');
        const signOutBtn = document.getElementById('googleSignOutBtn');
        const userInfo = document.getElementById('googleUserInfo');
        const driveActions = document.getElementById('driveActions');

        if (isSignedIn && profile) {
            if (signInBtn) signInBtn.style.display = 'none';
            if (signOutBtn) signOutBtn.style.display = 'inline-block';
            if (userInfo) {
                userInfo.textContent = `Signed in as ${profile.getName()}`;
                userInfo.style.display = 'block';
            }
            if (driveActions) driveActions.style.display = 'block';
        } else {
            if (signInBtn) signInBtn.style.display = 'inline-block';
            if (signOutBtn) signOutBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'none';
            if (driveActions) driveActions.style.display = 'none';
        }
    }

    /**
     * Save to IndexedDB for offline access
     */
    async saveToIndexedDB(songName, songData) {
        return IndexedDBManager.saveSong(songName, songData);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (window.songApp && window.songApp.songApp && window.songApp.songApp.showNotification) {
            window.songApp.songApp.showNotification(message, type);
        } else if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Export for global access
window.GoogleDriveManager = GoogleDriveManager;
