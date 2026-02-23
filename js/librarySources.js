/**
 * Library Sources Manager
 * librarySources.js
 *
 * Option C: "Library Sources" panel in the Drive Links modal.
 * Lets users browse curated open-source game audio collections
 * (Kenney, OpenGameArt, Sonniss, Freesound CC0, etc.) and fetch
 * their JSON manifests to dynamically add sounds to the app.
 *
 * Architecture
 * ─────────────
 *  • CURATED_SOURCES  — hard-coded catalogue of known CC0 libraries
 *  • LibrarySourcesManager — class that owns state + rendering
 *  • Exposed as window.LibrarySourcesManager for HTML wiring
 *
 * Integration points
 * ─────────────────
 *  • Calls window.addExternalLibraryFiles(files, libraryName)
 *    which must be defined in audioSearchEngine.js
 *  • Stores user-added sources in localStorage key h360_library_sources
 *  • Injects its UI into #librarySources (inside the Drive Links modal)
 */

// ─────────────────────────────────────────────────────────────────────────────
// CURATED SOURCE CATALOGUE
// ─────────────────────────────────────────────────────────────────────────────
const CURATED_SOURCES = [
    // ── Kenney.nl ─────────────────────────────────────────────────────────────
    {
        id: 'kenney-impact',
        name: 'Kenney – Impact Sounds',
        author: 'Kenney.nl',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        homepage: 'https://kenney.nl/assets/impact-sounds',
        description: '130 short impact, hit, and collision sound effects.',
        category: 'Combat / Foley',
        fileCount: 130,
        manifestUrl: 'audio/Kenney/Kenney.json',   // local – already bundled
        isLocal: true,
        tags: ['impact', 'hit', 'collision', 'combat'],
        color: '#f472b6',
    },
    {
        id: 'kenney-interface',
        name: 'Kenney – Interface Sounds',
        author: 'Kenney.nl',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        homepage: 'https://kenney.nl/assets/interface-sounds',
        description: '100 clean UI clicks, beeps, transitions, and notifications.',
        category: 'Misc / UI',
        fileCount: 100,
        manifestUrl: null,
        isLocal: false,
        downloadUrl: 'https://kenney.nl/assets/interface-sounds',
        tags: ['ui', 'click', 'interface', 'notification'],
        color: '#60a5fa',
    },
    {
        id: 'kenney-rpg',
        name: 'Kenney – RPG Audio',
        author: 'Kenney.nl',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        homepage: 'https://kenney.nl/assets/rpg-audio',
        description: '50 RPG sound effects – sword swings, magic spells, footsteps.',
        category: 'Combat / Foley',
        fileCount: 50,
        manifestUrl: null,
        isLocal: false,
        downloadUrl: 'https://kenney.nl/assets/rpg-audio',
        tags: ['rpg', 'sword', 'magic', 'footsteps'],
        color: '#f59e0b',
    },
    {
        id: 'kenney-digital',
        name: 'Kenney – Digital Audio',
        author: 'Kenney.nl',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        homepage: 'https://kenney.nl/assets/digital-audio',
        description: '60 digital / retro / 8-bit beeps and bloops.',
        category: 'Misc',
        fileCount: 60,
        manifestUrl: null,
        isLocal: false,
        downloadUrl: 'https://kenney.nl/assets/digital-audio',
        tags: ['digital', 'retro', '8bit', 'beep'],
        color: '#34d399',
    },
    {
        id: 'kenney-scifi',
        name: 'Kenney – Sci-Fi Sounds',
        author: 'Kenney.nl',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        homepage: 'https://kenney.nl/assets/sci-fi-sounds',
        description: '70 futuristic laser, tech, and spacecraft sound effects.',
        category: 'Misc / Combat',
        fileCount: 70,
        manifestUrl: null,
        isLocal: false,
        downloadUrl: 'https://kenney.nl/assets/sci-fi-sounds',
        tags: ['scifi', 'laser', 'tech', 'spacecraft'],
        color: '#a78bfa',
    },
    {
        id: 'kenney-ui-audio',
        name: 'Kenney – UI Audio',
        author: 'Kenney.nl',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        homepage: 'https://kenney.nl/assets/ui-audio',
        description: '50 UI sounds – hovers, clicks, popups, and toggles.',
        category: 'Misc / UI',
        fileCount: 50,
        manifestUrl: null,
        isLocal: false,
        downloadUrl: 'https://kenney.nl/assets/ui-audio',
        tags: ['ui', 'hover', 'popup', 'toggle'],
        color: '#fb923c',
    },

    // ── OpenGameArt.org ───────────────────────────────────────────────────────
    {
        id: 'oga-essential-sfx',
        name: 'OpenGameArt – Essential SFX Pack',
        author: 'Various (CC0)',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        homepage: 'https://opengameart.org/content/512-sound-effects-8-bit-style',
        description: '512 classic 8-bit–style sound effects — completely CC0.',
        category: 'All / Misc',
        fileCount: 512,
        manifestUrl: null,
        isLocal: false,
        downloadUrl: 'https://opengameart.org/content/512-sound-effects-8-bit-style',
        tags: ['8bit', 'retro', 'game', 'sfx'],
        color: '#f472b6',
    },
    {
        id: 'oga-battle-sfx',
        name: 'OpenGameArt – Battle Sound Effects',
        author: 'Various (CC0)',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        homepage: 'https://opengameart.org/content/battle-sound-effects',
        description: 'Swords, shields, arrows, spells — RPG combat SFX, CC0.',
        category: 'Combat',
        fileCount: 35,
        manifestUrl: null,
        isLocal: false,
        downloadUrl: 'https://opengameart.org/content/battle-sound-effects',
        tags: ['battle', 'sword', 'arrow', 'rpg'],
        color: '#ef4444',
    },
    {
        id: 'oga-ambient-nature',
        name: 'OpenGameArt – Ambient Nature Loops',
        author: 'Various (CC0)',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        homepage: 'https://opengameart.org/content/ambient-nature-sounds',
        description: 'Loopable forest, wind, rain, water, and cave ambiences.',
        category: 'Ambience',
        fileCount: 20,
        manifestUrl: null,
        isLocal: false,
        downloadUrl: 'https://opengameart.org/content/ambient-nature-sounds',
        tags: ['ambient', 'nature', 'loop', 'forest', 'rain'],
        color: '#34d399',
    },
    {
        id: 'oga-ui-sounds',
        name: 'OpenGameArt – Menu & UI Sounds',
        author: 'Various (CC0)',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        homepage: 'https://opengameart.org/content/menu-selection-click',
        description: 'Menu clicks, selections, confirmations, and transitions.',
        category: 'Misc / UI',
        fileCount: 40,
        manifestUrl: null,
        isLocal: false,
        downloadUrl: 'https://opengameart.org/content/menu-selection-click',
        tags: ['menu', 'ui', 'click', 'select'],
        color: '#60a5fa',
    },

    // ── Sonniss GDC Archive ───────────────────────────────────────────────────
    {
        id: 'sonniss-gdc-2024',
        name: 'Sonniss – GDC Game Audio Bundle 2024',
        author: 'Sonniss.com',
        license: 'Royalty-Free (no attribution required)',
        licenseUrl: 'https://sonniss.com/gameaudiogdc',
        homepage: 'https://sonniss.com/gameaudiogdc',
        description: 'Annual GDC giveaway — thousands of pro-grade SFX, royalty-free forever.',
        category: 'All',
        fileCount: 3000,
        manifestUrl: null,
        isLocal: false,
        downloadUrl: 'https://sonniss.com/gameaudiogdc',
        tags: ['professional', 'gdc', 'royaltyfree', 'all'],
        color: '#a78bfa',
    },

    // ── Freesound CC0 ─────────────────────────────────────────────────────────
    {
        id: 'freesound-cc0',
        name: 'Freesound – CC0 Collection',
        author: 'Freesound Community',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        homepage: 'https://freesound.org/search/?license=Creative+Commons+0',
        description: '315,000+ CC0 sounds. Use the Freesound browser tab to search directly (requires API key).',
        category: 'All',
        fileCount: 315000,
        manifestUrl: null,
        isLocal: false,
        downloadUrl: 'https://freesound.org/search/?license=Creative+Commons+0',
        tags: ['cc0', 'all', 'massive', 'community'],
        color: '#f59e0b',
    },

    // ── itch.io CC0 packs ─────────────────────────────────────────────────────
    {
        id: 'itch-cc0-weapons',
        name: 'itch.io – CC0 Weapon SFX',
        author: 'Various',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        homepage: 'https://itch.io/game-assets/free/tag-sound-effects/tag-cc0',
        description: 'Curated CC0 weapon, impact, and combat sounds from itch.io.',
        category: 'Combat',
        fileCount: null,
        manifestUrl: null,
        isLocal: false,
        downloadUrl: 'https://itch.io/game-assets/free/tag-sound-effects/tag-cc0',
        tags: ['weapon', 'combat', 'cc0', 'itch'],
        color: '#fb923c',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// LIBRARY SOURCES MANAGER
// ─────────────────────────────────────────────────────────────────────────────
class LibrarySourcesManager {
    constructor() {
        this.userSources = this.loadUserSources();   // custom URLs added by the user
        this.loadedLibraries = this.loadLoadedLibraries(); // { id: true } loaded this session
        this.activeFilter = 'all';
        this.panel = null;
    }

    // ── Persistence ────────────────────────────────────────────────────────────
    loadUserSources() {
        try { return JSON.parse(localStorage.getItem('h360_library_sources') || '[]'); }
        catch { return []; }
    }
    saveUserSources() {
        localStorage.setItem('h360_library_sources', JSON.stringify(this.userSources));
    }
    loadLoadedLibraries() {
        try { return JSON.parse(localStorage.getItem('h360_loaded_libraries') || '{}'); }
        catch { return {}; }
    }
    saveLoadedLibraries() {
        localStorage.setItem('h360_loaded_libraries', JSON.stringify(this.loadedLibraries));
    }

    // ── All sources (curated + user) ───────────────────────────────────────────
    allSources() {
        return [...CURATED_SOURCES, ...this.userSources];
    }

    // ── Inject panel into modal ────────────────────────────────────────────────
    inject() {
        // Find the Drive Links modal content — append after the External Links section
        const modal = document.getElementById('driveLinksModal');
        if (!modal) return;

        // Remove existing panel if re-injecting
        const existing = document.getElementById('librarySourcesPanel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'librarySourcesPanel';
        panel.className = 'settings-section library-sources-panel';
        panel.innerHTML = this.buildPanelHTML();

        // Insert before the closing tag of modal-content
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) modalContent.appendChild(panel);

        this.panel = panel;
        this.bindPanelEvents();
        this.renderSourceCards();
    }

    buildPanelHTML() {
        return `
            <h3><i class="fas fa-box-open"></i> Open-Source Library Sources</h3>
            <p>Browse and load free CC0 / royalty-free game audio libraries directly into your collection.</p>

            <!-- Filter chips -->
            <div class="ls-filter-bar">
                <button class="ls-chip active" data-filter="all">All</button>
                <button class="ls-chip" data-filter="CC0">CC0 Only</button>
                <button class="ls-chip" data-filter="local">Bundled</button>
                <button class="ls-chip" data-filter="Kenney">Kenney</button>
                <button class="ls-chip" data-filter="OpenGameArt">OpenGameArt</button>
                <button class="ls-chip" data-filter="Sonniss">Sonniss</button>
            </div>

            <!-- Source cards grid -->
            <div class="ls-cards-grid" id="lsCardsGrid">
                <!-- populated by JS -->
            </div>

            <!-- Divider -->
            <div class="ls-divider">
                <span>Add Custom Source</span>
            </div>

            <!-- Custom URL form -->
            <div class="ls-custom-form">
                <p class="ls-custom-hint">
                    <i class="fas fa-info-circle"></i>
                    Paste the URL of any JSON manifest file that follows the H360 audio manifest format
                    (<code>array of {id, path, name, category, format, size, tags, description}</code>).
                    The manifest will be fetched and its files merged into your library.
                </p>
                <div class="ls-custom-inputs">
                    <input type="text"  id="lsCustomName" placeholder="Library name (e.g. My SFX Pack)" />
                    <input type="url"   id="lsCustomUrl"  placeholder="Manifest URL (https://...)" />
                    <input type="text"  id="lsCustomAuthor" placeholder="Author (optional)" />
                    <div class="ls-custom-actions">
                        <button class="btn" id="lsAddCustomBtn">
                            <i class="fas fa-plus"></i> Add Source
                        </button>
                        <button class="btn btn-secondary" id="lsTestUrlBtn">
                            <i class="fas fa-vial"></i> Test URL
                        </button>
                    </div>
                </div>
                <div id="lsCustomStatus" class="ls-status hidden"></div>
            </div>

            <!-- User-added sources -->
            <div id="lsUserSources" class="ls-user-sources">
                <!-- populated by JS -->
            </div>
        `;
    }

    bindPanelEvents() {
        // Filter chips
        this.panel.querySelectorAll('.ls-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.panel.querySelectorAll('.ls-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeFilter = chip.dataset.filter;
                this.renderSourceCards();
            });
        });

        // Add custom source
        document.getElementById('lsAddCustomBtn')?.addEventListener('click', () => this.addCustomSource());
        document.getElementById('lsTestUrlBtn')?.addEventListener('click',  () => this.testCustomUrl());

        // Enter key on URL field
        document.getElementById('lsCustomUrl')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') this.addCustomSource();
        });
    }

    // ── Render source cards ────────────────────────────────────────────────────
    renderSourceCards() {
        const grid = document.getElementById('lsCardsGrid');
        if (!grid) return;

        const filter = this.activeFilter;
        const sources = CURATED_SOURCES.filter(s => {
            if (filter === 'all')         return true;
            if (filter === 'CC0')         return s.license === 'CC0';
            if (filter === 'local')       return s.isLocal;
            return s.author.includes(filter) || s.name.includes(filter);
        });

        if (sources.length === 0) {
            grid.innerHTML = `<p class="ls-empty">No sources match this filter.</p>`;
            return;
        }

        grid.innerHTML = sources.map(s => this.buildSourceCard(s)).join('');

        // Bind card buttons
        grid.querySelectorAll('[data-ls-load]').forEach(btn => {
            btn.addEventListener('click', () => this.loadSource(btn.dataset.lsLoad));
        });
        grid.querySelectorAll('[data-ls-visit]').forEach(btn => {
            btn.addEventListener('click', () => window.open(btn.dataset.lsVisit, '_blank'));
        });
    }

    buildSourceCard(s) {
        const isLoaded  = !!this.loadedLibraries[s.id];
        const countStr  = s.fileCount ? `${s.fileCount.toLocaleString()} files` : 'Varies';
        const canLoad   = s.isLocal || !!s.manifestUrl;
        const loadLabel = isLoaded ? 'Reload' : (canLoad ? 'Load' : 'Download');
        const loadIcon  = isLoaded ? 'fa-sync' : (canLoad ? 'fa-download' : 'fa-external-link-alt');
        const loadedBadge = isLoaded
            ? `<span class="ls-badge ls-badge-loaded"><i class="fas fa-check"></i> Loaded</span>`
            : '';

        return `
        <div class="ls-card" style="--ls-accent: ${s.color}">
            <div class="ls-card-header">
                <div class="ls-card-title">${esc(s.name)}</div>
                <div class="ls-card-badges">
                    <span class="ls-badge ls-badge-license">${esc(s.license)}</span>
                    ${loadedBadge}
                </div>
            </div>
            <div class="ls-card-meta">
                <span><i class="fas fa-user"></i> ${esc(s.author)}</span>
                <span><i class="fas fa-folder"></i> ${esc(s.category)}</span>
                <span><i class="fas fa-music"></i> ${countStr}</span>
            </div>
            <p class="ls-card-desc">${esc(s.description)}</p>
            <div class="ls-card-tags">
                ${(s.tags || []).map(t => `<span class="ls-tag">${esc(t)}</span>`).join('')}
            </div>
            <div class="ls-card-actions">
                <button class="btn${canLoad ? '' : ' btn-secondary'}"
                    data-ls-load="${s.id}"
                    title="${canLoad ? 'Load into collection' : 'Opens the download page'}">
                    <i class="fas ${loadIcon}"></i> ${loadLabel}
                </button>
                <button class="btn btn-secondary"
                    data-ls-visit="${s.licenseUrl}"
                    title="View license">
                    <i class="fas fa-certificate"></i> License
                </button>
                ${s.homepage ? `
                <button class="btn btn-secondary"
                    data-ls-visit="${s.homepage}"
                    title="Visit homepage">
                    <i class="fas fa-external-link-alt"></i> Visit
                </button>` : ''}
            </div>
        </div>`;
    }

    // ── Load a curated source ──────────────────────────────────────────────────
    async loadSource(sourceId) {
        const source = CURATED_SOURCES.find(s => s.id === sourceId);
        if (!source) return;

        // If the source has no local manifest, open its download page
        if (!source.manifestUrl && !source.isLocal) {
            window.open(source.downloadUrl || source.homepage, '_blank');
            showToast(`📦 Opening ${source.name} download page…`, 4000);
            return;
        }

        showToast(`⏳ Loading ${source.name}…`, 3000);

        try {
            const response = await fetch(source.manifestUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Manifest is empty or invalid');
            }

            // Tag every file with library source
            data.forEach(f => { f.library = f.library || source.name; });

            // Inject into the main audio engine
            this.injectFiles(data, source.name);

            // Mark as loaded
            this.loadedLibraries[source.id] = true;
            this.saveLoadedLibraries();

            // Re-render cards to show "Loaded" badge
            this.renderSourceCards();

            showToast(`✅ Loaded ${data.length} files from ${source.name}`, 4000);

        } catch (err) {
            showToast(`❌ Failed to load ${source.name}: ${err.message}`, 5000);
            console.error('LibrarySourcesManager.loadSource:', err);
        }
    }

    // ── Custom source management ───────────────────────────────────────────────
    async addCustomSource() {
        const name   = (document.getElementById('lsCustomName')?.value   || '').trim();
        const url    = (document.getElementById('lsCustomUrl')?.value    || '').trim();
        const author = (document.getElementById('lsCustomAuthor')?.value || '').trim() || 'Unknown';
        const status = document.getElementById('lsCustomStatus');

        if (!name || !url) {
            this.setStatus(status, 'error', '⚠️ Please enter both a name and a manifest URL.');
            return;
        }

        if (!url.startsWith('http')) {
            this.setStatus(status, 'error', '⚠️ URL must start with http:// or https://');
            return;
        }

        this.setStatus(status, 'info', '⏳ Fetching manifest…');

        try {
            const data = await this.fetchManifest(url);

            const source = {
                id:          'user-' + Date.now(),
                name,
                author,
                license:     'Unknown',
                licenseUrl:  '#',
                homepage:    url,
                description: `Custom source added by user. ${data.length} files.`,
                category:    'All',
                fileCount:   data.length,
                manifestUrl: url,
                isLocal:     false,
                tags:        [],
                color:       '#94a3b8',
                isUserAdded: true,
            };

            this.userSources.push(source);
            this.saveUserSources();

            // Tag and inject files
            data.forEach(f => { f.library = f.library || name; });
            this.injectFiles(data, name);

            this.loadedLibraries[source.id] = true;
            this.saveLoadedLibraries();

            // Clear inputs
            ['lsCustomName','lsCustomUrl','lsCustomAuthor'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });

            this.setStatus(status, 'success', `✅ Loaded ${data.length} files from "${name}".`);
            this.renderUserSources();

        } catch (err) {
            this.setStatus(status, 'error', `❌ ${err.message}`);
        }
    }

    async testCustomUrl() {
        const url    = (document.getElementById('lsCustomUrl')?.value || '').trim();
        const status = document.getElementById('lsCustomStatus');

        if (!url) {
            this.setStatus(status, 'error', '⚠️ Enter a URL first.');
            return;
        }

        this.setStatus(status, 'info', '⏳ Testing URL…');

        try {
            const data = await this.fetchManifest(url);
            const sample = data[0] ? `First entry: "${data[0].name || data[0].path}"` : '';
            this.setStatus(status, 'success', `✅ Valid manifest — ${data.length} files found. ${sample}`);
        } catch (err) {
            this.setStatus(status, 'error', `❌ ${err.message}`);
        }
    }

    async fetchManifest(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status} – could not fetch manifest`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Manifest must be a JSON array of audio file objects');
        if (data.length === 0)    throw new Error('Manifest is empty');
        // Validate first entry has minimum required fields
        const first = data[0];
        if (!first.path && !first.url) throw new Error('Manifest entries must have a "path" or "url" field');
        return data;
    }

    renderUserSources() {
        const container = document.getElementById('lsUserSources');
        if (!container) return;

        if (this.userSources.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="ls-divider"><span>Your Custom Sources</span></div>
            <div class="ls-user-list">
                ${this.userSources.map((s, i) => `
                <div class="ls-user-item">
                    <div class="ls-user-info">
                        <div class="ls-user-name">${esc(s.name)}</div>
                        <div class="ls-user-meta">${esc(s.fileCount)} files · <a href="${esc(s.manifestUrl)}" target="_blank" rel="noopener">${esc(s.manifestUrl.substring(0, 60))}${s.manifestUrl.length > 60 ? '…' : ''}</a></div>
                    </div>
                    <div class="ls-user-actions">
                        <button class="btn btn-secondary" data-user-reload="${i}" title="Reload">
                            <i class="fas fa-sync"></i>
                        </button>
                        <button class="btn btn-secondary" data-user-remove="${i}" title="Remove">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>`).join('')}
            </div>`;

        // Bind
        container.querySelectorAll('[data-user-reload]').forEach(btn => {
            btn.addEventListener('click', () => this.reloadUserSource(parseInt(btn.dataset.userReload)));
        });
        container.querySelectorAll('[data-user-remove]').forEach(btn => {
            btn.addEventListener('click', () => this.removeUserSource(parseInt(btn.dataset.userRemove)));
        });
    }

    async reloadUserSource(idx) {
        const source = this.userSources[idx];
        if (!source) return;
        showToast(`⏳ Reloading ${source.name}…`, 3000);
        try {
            const data = await this.fetchManifest(source.manifestUrl);
            data.forEach(f => { f.library = f.library || source.name; });
            this.injectFiles(data, source.name);
            source.fileCount = data.length;
            this.saveUserSources();
            showToast(`✅ Reloaded ${data.length} files from "${source.name}"`, 4000);
        } catch (err) {
            showToast(`❌ Reload failed: ${err.message}`, 5000);
        }
    }

    removeUserSource(idx) {
        const source = this.userSources[idx];
        if (!source) return;
        if (!confirm(`Remove "${source.name}" from your sources?\n\nNote: already-loaded files will remain in the current session until you reload the page.`)) return;
        this.userSources.splice(idx, 1);
        this.saveUserSources();
        this.renderUserSources();
        showToast(`🗑️ Removed "${source.name}"`, 2500);
    }

    // ── Bridge to audio engine ─────────────────────────────────────────────────
    injectFiles(files, libraryName) {
        // Primary: audioSearchEngine exposes addExternalLibraryFiles()
        if (typeof window.addExternalLibraryFiles === 'function') {
            window.addExternalLibraryFiles(files, libraryName);
            return;
        }
        // Fallback: directly mutate the engine's audioFiles array
        if (Array.isArray(window.audioFiles)) {
            const maxId = window.audioFiles.reduce((m, f) => Math.max(m, f.id || 0), 0);
            files.forEach((f, i) => {
                if (!f.id) f.id = maxId + i + 1;
            });
            window.audioFiles.push(...files);
            window.filteredFiles = [...window.audioFiles];
            if (typeof window.renderGrid === 'function') window.renderGrid();
            if (typeof window.updateStats === 'function') window.updateStats();
            if (typeof window.updateLibraryFilter === 'function') window.updateLibraryFilter();
        } else {
            console.warn('LibrarySourcesManager: audioSearchEngine not ready, cannot inject files.');
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    setStatus(el, type, msg) {
        if (!el) return;
        el.className = `ls-status ls-status-${type}`;
        el.textContent = msg;
        el.classList.remove('hidden');
        if (type === 'success') {
            setTimeout(() => el.classList.add('hidden'), 6000);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────
function esc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Fallback showToast in case audioSearchEngine hasn't loaded yet
function showToast(msg, duration = 2500) {
    if (typeof window.showToast === 'function' && window.showToast !== showToast) {
        window.showToast(msg, duration);
        return;
    }
    const toast = document.getElementById('toast');
    const label = document.getElementById('toastMessage');
    if (toast && label) {
        label.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), duration);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES  (injected once at runtime — no extra CSS file needed)
// ─────────────────────────────────────────────────────────────────────────────
function injectLibrarySourcesCSS() {
    if (document.getElementById('lsStyles')) return;
    const style = document.createElement('style');
    style.id = 'lsStyles';
    style.textContent = `
/* ── Library Sources Panel ─────────────────────────────────────────────── */
.library-sources-panel {
    border-top: 1px solid var(--border-color);
    padding-top: 1.5rem;
    margin-top: 0;
}

/* Filter chips */
.ls-filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1.25rem;
}
.ls-chip {
    padding: 0.3rem 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    background: var(--bg-primary);
    color: var(--text-secondary);
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.18s;
}
.ls-chip:hover { border-color: var(--accent-color); color: var(--accent-color); }
.ls-chip.active {
    background: var(--accent-color);
    border-color: var(--accent-color);
    color: white;
}

/* Cards grid */
.ls-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}
.ls-empty { color: var(--text-secondary); font-size: 0.9rem; grid-column: 1/-1; }

/* Individual card */
.ls-card {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-top: 3px solid var(--ls-accent, var(--accent-color));
    border-radius: 10px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    transition: box-shadow 0.2s, transform 0.2s;
}
.ls-card:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    transform: translateY(-2px);
}

.ls-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
    flex-wrap: wrap;
}
.ls-card-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
}
.ls-card-badges { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.ls-badge {
    font-size: 0.65rem;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    white-space: nowrap;
}
.ls-badge-license { background: rgba(52,211,153,0.15); color: #34d399; }
.ls-badge-loaded  { background: rgba(244,114,182,0.15); color: var(--accent-color); }

.ls-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
}
.ls-card-meta span { display: flex; align-items: center; gap: 0.25rem; }

.ls-card-desc {
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.5;
    flex: 1;
}

.ls-card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}
.ls-tag {
    font-size: 0.65rem;
    padding: 0.1rem 0.35rem;
    background: var(--accent-light);
    color: var(--accent-color);
    border-radius: 4px;
}

.ls-card-actions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: auto;
    padding-top: 0.4rem;
    border-top: 1px solid var(--border-color);
}
.ls-card-actions .btn {
    font-size: 0.78rem;
    padding: 0.4rem 0.7rem;
}

/* Divider */
.ls-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1.25rem 0 1rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
}
.ls-divider::before, .ls-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-color);
}

/* Custom source form */
.ls-custom-hint {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
    line-height: 1.55;
}
.ls-custom-hint code {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 3px;
    padding: 0.1rem 0.3rem;
    font-size: 0.75rem;
}
.ls-custom-inputs {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.ls-custom-inputs input {
    width: 100%;
    padding: 0.55rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.88rem;
}
.ls-custom-inputs input:focus { outline: none; border-color: var(--accent-color); }
.ls-custom-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.ls-status {
    margin-top: 0.6rem;
    padding: 0.6rem 0.8rem;
    border-radius: 6px;
    font-size: 0.82rem;
}
.ls-status.hidden { display: none; }
.ls-status-info    { background: rgba(96,165,250,0.1); color: #60a5fa; }
.ls-status-success { background: rgba(52,211,153,0.1); color: #34d399; }
.ls-status-error   { background: rgba(248,113,113,0.1); color: #f87171; }

/* User-added sources list */
.ls-user-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.ls-user-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.85rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
}
.ls-user-info { flex: 1; min-width: 0; }
.ls-user-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.ls-user-meta {
    font-size: 0.75rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.ls-user-meta a { color: var(--accent-color); }
.ls-user-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }
.ls-user-actions .btn { padding: 0.35rem 0.6rem; font-size: 0.78rem; }

/* Responsive */
@media (max-width: 600px) {
    .ls-cards-grid { grid-template-columns: 1fr; }
    .ls-card-actions { flex-direction: column; }
}
    `;
    document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-INIT
// ─────────────────────────────────────────────────────────────────────────────
let lsManager = null;

document.addEventListener('DOMContentLoaded', () => {
    injectLibrarySourcesCSS();
    lsManager = new LibrarySourcesManager();

    // Inject panel when the Drive Links modal first opens
    const driveLinksBtn = document.getElementById('driveLinksBtn');
    if (driveLinksBtn) {
        driveLinksBtn.addEventListener('click', () => {
            // Small delay to let the modal render first
            setTimeout(() => {
                lsManager.inject();
                lsManager.renderUserSources();

                // Re-load any previously saved user sources
                lsManager.userSources.forEach(async (s) => {
                    if (lsManager.loadedLibraries[s.id]) return; // already loaded this session
                    try {
                        const data = await lsManager.fetchManifest(s.manifestUrl);
                        data.forEach(f => { f.library = f.library || s.name; });
                        lsManager.injectFiles(data, s.name);
                        lsManager.loadedLibraries[s.id] = true;
                        lsManager.saveLoadedLibraries();
                    } catch (e) { /* silently skip */ }
                });
            }, 50);
        });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPOSE GLOBALS for audioSearchEngine bridge
// ─────────────────────────────────────────────────────────────────────────────
window.LibrarySourcesManager = LibrarySourcesManager;
window.lsManager = lsManager;

/**
 * addExternalLibraryFiles — called by LibrarySourcesManager to merge files
 * into the running audio engine.
 *
 * audioSearchEngine.js should define this function, but we provide a
 * safe shim here so librarySources.js can work even when loaded first.
 */
if (typeof window.addExternalLibraryFiles !== 'function') {
    window.addExternalLibraryFiles = function(files, libraryName) {
        // Will be overwritten by the real implementation in audioSearchEngine.js
        // This shim stores files in a queue to be consumed on engine init
        window._pendingLibraryFiles = window._pendingLibraryFiles || [];
        window._pendingLibraryFiles.push(...files.map(f => ({
            ...f,
            library: f.library || libraryName
        })));
        console.log(`LibrarySources: queued ${files.length} files from "${libraryName}" (engine not ready yet)`);
    };
}
