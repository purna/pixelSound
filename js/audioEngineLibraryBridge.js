/**
 * audioEngineLibraryBridge.js
 *
 * Append this block to the BOTTOM of audioSearchEngine.js
 * (or load as a separate script after it).
 *
 * It exposes two functions that librarySources.js needs:
 *   • window.addExternalLibraryFiles(files, libraryName)
 *   • window.updateLibraryFilter()
 *
 * It also consumes window._pendingLibraryFiles if librarySources.js
 * happened to be loaded before the engine was ready.
 */

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE LIBRARY FILTER DROPDOWN
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
// ADD EXTERNAL LIBRARY FILES
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Merges an array of audio file objects from an external source into the
 * running engine state, deduplicates by path, refreshes the UI, and updates
 * the library filter dropdown.
 *
 * @param {Array}  files        - Array of audio file objects (manifest format)
 * @param {string} libraryName  - Display name for the source library
 */
window.addExternalLibraryFiles = function(files, libraryName) {
    if (!Array.isArray(files) || files.length === 0) return;

    // Assign IDs to any files that don't have them
    const maxId = audioFiles.reduce((m, f) => Math.max(m, f.id || 0), 0);
    let nextId  = maxId + 1;

    // Normalise and tag each incoming file
    const normalised = files.map(f => ({
        id:          f.id          || nextId++,
        path:        f.path        || f.url || '',
        name:        f.name        || (f.path || '').split('/').pop() || 'Unknown',
        category:    f.category    || 'Misc',
        format:      f.format      || guessFormat(f.path || f.url || ''),
        size:        f.size        || 0,
        duration:    f.duration    || 0,
        rating:      f.rating      || 0,
        tags:        Array.isArray(f.tags) ? f.tags : (f.tags ? String(f.tags).split(',').map(t => t.trim()) : []),
        description: f.description || '',
        dateAdded:   f.dateAdded   || new Date().toISOString(),
        library:     f.library     || libraryName,
    }));

    // Deduplicate: skip files whose path already exists in the master list
    const existingPaths = new Set(audioFiles.map(f => f.path));
    const newFiles = normalised.filter(f => f.path && !existingPaths.has(f.path));

    if (newFiles.length === 0) {
        showToast(`ℹ️ All files from "${libraryName}" are already in your collection.`);
        return;
    }

    // Merge metadata (sheets / local overrides)
    const merged = mergeMetadata(newFiles);

    // Append to master list
    audioFiles.push(...merged);

    // Refresh filtered list and UI
    applyFilters();
    updateStats();
    updateLibraryFilter();

    showToast(`📦 Added ${newFiles.length} files from "${libraryName}"`, 4000);

    console.log(`[Library Bridge] Added ${newFiles.length} files from "${libraryName}".`,
                `Total: ${audioFiles.length}`);
};

/**
 * Guess audio format from a file path/URL extension
 */
function guessFormat(path) {
    const ext = path.split('.').pop().toLowerCase().split('?')[0];
    return ['wav','mp3','ogg','flac','aac','m4a','wma','aiff'].includes(ext) ? ext : 'wav';
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSUME PENDING QUEUE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * librarySources.js may have queued files before the engine initialised.
 * Drain that queue now.
 */
(function drainPendingLibraryFiles() {
    const pending = window._pendingLibraryFiles;
    if (!Array.isArray(pending) || pending.length === 0) return;

    // Group by library name for cleaner toast messages
    const groups = {};
    pending.forEach(f => {
        const lib = f.library || 'External';
        (groups[lib] = groups[lib] || []).push(f);
    });

    Object.entries(groups).forEach(([lib, files]) => {
        window.addExternalLibraryFiles(files, lib);
    });

    window._pendingLibraryFiles = [];
})();

// ─────────────────────────────────────────────────────────────────────────────
// EXPOSE ENGINE INTERNALS for librarySources.js fallback path
// ─────────────────────────────────────────────────────────────────────────────
window.audioFiles    = audioFiles;      // live reference (object mutation is shared)
window.filteredFiles = filteredFiles;
window.renderGrid    = renderGrid;
window.applyFilters  = applyFilters;
window.updateStats   = updateStats;
window.updateLibraryFilter = updateLibraryFilter;
window.mergeMetadata = mergeMetadata;

// Keep window.audioFiles in sync when applyFilters/renderGrid reassign
// filteredFiles (they use the module-level variable, not the window property)
const _origApplyFilters = applyFilters;
window.applyFilters = function() {
    _origApplyFilters();
    window.filteredFiles = filteredFiles;   // keep window ref current
};

const _origRenderGrid = renderGrid;
window.renderGrid = function() {
    _origRenderGrid();
    window.filteredFiles = filteredFiles;
};
