# Google Drive Integration Setup Guide

This guide explains how to set up Google Drive integration for the H360 Sound Collection app.

## Overview

The Google Drive integration allows you to:
- Sign in with your Google account
- Browse and select folders from your Google Drive
- Index audio files (MP3, WAV, OGG, FLAC, AAC, M4A, WMA, AIFF) from selected folders
- Add indexed files to your sound collection

## Prerequisites

1. A Google account
2. Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top and select **"New Project"**
3. Enter a project name (e.g., "H360 Sound Collection")
4. Click **"Create"**
5. Select your new project from the dropdown

## Step 2: Enable Required APIs

1. In the Cloud Console, go to **"APIs & Services" > "Library"**
2. Search for **"Google Drive API"**
3. Click on it and press **"Enable"**
4. (Optional) Search for **"Google Picker API"** and enable it for enhanced folder selection

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services" > "OAuth consent screen"**
2. Select **"External"** user type (unless you have a Google Workspace account)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: H360 Sound Collection
   - **User support email**: Your email
   - **App logo**: (Optional) Upload your app logo
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. On the **Scopes** page:
   - Click **"Add or Remove Scopes"**
   - Add these scopes:
     - `https://www.googleapis.com/auth/drive.readonly`
     - `https://www.googleapis.com/auth/drive.metadata.readonly`
   - Click **"Update"** then **"Save and Continue"**
7. On the **Test Users** page:
   - Add your Google account email as a test user
   - Click **"Add"** then **"Save and Continue"**
8. Review and click **"Back to Dashboard"**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials" > "OAuth client ID"**
3. Select **"Web application"** as the application type
4. Enter a name (e.g., "H360 Sound Collection Web Client")
5. Under **"Authorized JavaScript origins"**:
   - Add your app's origin (e.g., `http://localhost:3000` for development)
   - For production, add your actual domain (e.g., `https://yourdomain.com`)
6. Under **"Authorized redirect URIs"**:
   - Add the same origins
7. Click **"Create"**
8. **Copy the Client ID** - you'll need this for the app configuration

## Step 5: Configure the App

1. Open `app/js/googleDriveIntegration.js`
2. Find the `GOOGLE_DRIVE_CONFIG` object at the top of the file
3. Replace `YOUR_CLIENT_ID_HERE` with your OAuth Client ID:

```javascript
const GOOGLE_DRIVE_CONFIG = {
    CLIENT_ID: '123456789-abcdefg.apps.googleusercontent.com',
    // ... rest of config
};
```

4. (Optional) If you created an API Key, add it to the `API_KEY` field

## Step 6: Test the Integration

1. Open the app in your browser
2. Click the Google Drive icon in the header
3. Click **"Sign in with Google"**
4. Authorize the app when prompted
5. Once signed in, you can:
   - Click **"Browse Folders"** to select a folder from your Drive
   - Or paste a Google Drive folder URL directly

## Usage

### Indexing a Folder

1. Sign in with Google
2. Either:
   - Click **"Browse Folders"** and select a folder from the list
   - Paste a Google Drive folder URL and click **"Index"**
3. Wait for the indexing to complete
4. Audio files will be added to your collection

### Managing Indexed Folders

- View all indexed folders in the **"Indexed Folders"** section
- Click the sync icon to re-index a folder
- Click the trash icon to remove a folder and its files from the collection

### Audio File Playback

- Google Drive files are marked with a "Drive" badge
- Playback uses the file's web content link from Google Drive
- Files are streamed directly from Google Drive

## Troubleshooting

### "Sign in failed" or "Access denied"
- Make sure you've added yourself as a test user in the OAuth consent screen
- Check that the scopes are correctly configured
- Verify your Client ID is correct

### "Failed to load folders"
- Ensure the Google Drive API is enabled
- Check your internet connection
- Try signing out and signing back in

### "No audio files found"
- Make sure the folder contains supported audio formats
- Check that the files are not in the trash
- Verify you have access to the folder

### Files not playing
- Google Drive files require an active internet connection
- Some files may not be playable due to format restrictions
- Try downloading the file directly from Google Drive

## Security Notes

- The app only requests **read-only** access to your Google Drive
- Your Google credentials are handled by Google's OAuth system
- Access tokens are stored temporarily in the browser session
- No files are downloaded or stored locally unless you explicitly download them

## Production Deployment

For production deployment:

1. Update the OAuth consent screen to "Published" status
2. Add your production domain to authorized origins
3. Consider implementing server-side token validation for enhanced security
4. Review Google's API usage limits and quotas

## API Quotas

Google Drive API has usage limits:
- Default: 1,000,000,000 requests per day
- Per-minute quotas may apply
- For heavy usage, consider requesting higher quotas

## Support

For issues with:
- **Google Cloud Console**: [Google Cloud Support](https://cloud.google.com/support)
- **This App**: Check the app's documentation or contact the developer
