# Pixel Sound Collection - Audio Search Engine

A comprehensive audio search engine for browsing, previewing, and downloading sound effects from multiple libraries.

## Features

- 🔍 **Search & Filter** - Search by name, tags, description, or path. Filter by category, format, and library.
- 🎵 **Audio Playback** - Preview audio files directly in the browser with Howler.js
- 📊 **Google Sheets Integration** - Audio metadata loaded from published Google Sheets
- 🔗 **Google Drive Support** - Audio files hosted on Google Drive with automatic URL conversion
- ⭐ **Ratings & Tags** - Rate files and manage custom tags
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Libraries Included

| Library | Description |
|---------|-------------|
| **H360s** | Custom H360 sound collection |
| **Kenney** | Kenney digital audio assets |
| **FilmCow** | FilmCow sound effects |
| **Adobe** | Adobe Sound Effects collection |
| **Amiga Music** | Classic Amiga game music and MODs |
| **Boom Library** | Cinematic hits, metals, and trailers |
| **XD SoundKit** | UI sounds, dings, swooshes, and tics |
| **Other** | Miscellaneous sound files |

## Setup

### 1. Google Sheets Configuration

The audio metadata is loaded from a published Google Sheets CSV. The sheet should have the following columns:

| Column | Description |
|--------|-------------|
| **File Path** | Google Drive URL (e.g., `https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk`) |
| **Display Name** | Human-readable name for the audio file |
| **Tags** | Comma-separated tags for searching |
| **Description** | File description |
| **Rating (1–5)** | Optional rating from 1 to 5 |
| **Folder Name** | Category/library name (used for library detection) |

### 2. Publishing Your Google Sheet

1. Open your Google Sheets document
2. Go to **File → Share → Publish to web**
3. Select the sheet/tab with audio data
4. Choose **Comma-separated values (CSV)** format
5. Click **Publish**
6. Copy the published URL and update `sheetsCsvUrl` in `js/audioSearchEngine.js`

### 3. Google Drive Audio Files

For audio files hosted on Google Drive:

1. Upload your audio files to Google Drive
2. Get the shareable link for each file
3. Add the links to your Google Sheets
4. The app automatically converts Drive URLs to playable format

**Note:** For best playback compatibility, ensure your Drive files are set to "Anyone with the link can view".

## File Structure

```
app/
├── audio-search.html      # Main HTML page
├── css/
│   ├── base.css          # Base styles
│   └── audio-search.css  # Audio search specific styles
├── js/
│   ├── audioSearchEngine.js       # Main search engine logic
│   ├── audioEngineLibraryBridge.js # Library bridge
│   ├── librarySources.js          # Library source definitions
│   └── googleDriveIntegration.js  # Google Drive API integration
├── scripts/
│   ├── generateAdobeManifest.js      # Generate Adobe library manifest
│   ├── generateAmigaMusicManifest.js # Generate Amiga Music manifest
│   ├── generateBoomLibraryManifest.js # Generate Boom Library manifest
│   ├── generateXDSoundKitManifest.js # Generate XD SoundKit manifest
│   └── generateOtherManifest.js      # Generate Other library manifest
├── audio/                 # Local audio files (fallback)
│   ├── H360s/
│   ├── Kenney/
│   ├── FilmCow/
│   ├── Adobe/
│   ├── Amiga Music/
│   ├── BoomLibrary/
│   ├── XDSoundKit/
│   └── Other/
└── fonts/                 # Font Awesome icons
```

## Usage

### Basic Search

1. Type in the search box to search by name, tags, or description
2. Use the category buttons to filter by type (Ambience, Combat, Foley, Misc, Voices)
3. Use the dropdown filters for format and library
4. Click on a card to view details or click the play button to preview

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` | Previous track |
| `→` | Next track |
| `Esc` | Close modals |

### Audio Player Controls

- **Play/Pause** - Start or pause playback
- **Previous/Next** - Navigate between tracks
- **Progress Bar** - Click to seek
- **Volume Slider** - Adjust volume
- **Loop** - Toggle loop mode
- **Download** - Download the current file

## Generating Local Manifests

If you want to use local audio files instead of Google Sheets:

```bash
# Generate all library manifests
node scripts/generateAdobeManifest.js
node scripts/generateAmigaMusicManifest.js
node scripts/generateBoomLibraryManifest.js
node scripts/generateXDSoundKitManifest.js
node scripts/generateOtherManifest.js
```

## Google Sheets Metadata Integration

You can connect a Google Sheets for managing ratings, tags, and descriptions:

1. Go to **Settings → Metadata**
2. Enter your Google Sheets URL
3. Click **Connect Sheet**
4. Make sure the sheet is published to the web

### Sheet Structure for Metadata

| Column A | Column B | Column C | Column D | Column E |
|----------|----------|----------|----------|----------|
| File Path | Display Name | Tags | Description | Rating |

## Customization

### Adding New Libraries

1. Add the library option to the dropdown in `audio-search.html`:
```html
<option value="NewLibrary">New Library</option>
```

2. Add library detection in `audioSearchEngine.js`:
```javascript
else if (library.includes('NewLibrary')) {
    library = 'NewLibrary';
}
```

3. Add your files to the Google Sheets with the appropriate Folder Name

### Theming

The app uses CSS custom properties for theming. Edit `css/base.css` to customize:

```css
:root {
    --accent-color: #f472b6;
    --bg-color: #ffffff;
    --text-color: #1e293b;
    /* ... */
}

[data-theme="dark"] {
    --bg-color: #1e293b;
    --text-color: #f8fafc;
    /* ... */
}
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

**Note:** Audio playback requires modern browser support for HTML5 Audio.

## Technologies Used

- **Howler.js** - Audio library for playback
- **Font Awesome** - Icons
- **Google Sheets API** - Metadata storage
- **Google Drive** - Audio file hosting

## License

© 2026 H360 Sound Collection. All rights reserved.

## Links

- [PixelAgent](https://pixelagent.co.uk)
- [Kenney Assets](https://kenney.nl/assets)
