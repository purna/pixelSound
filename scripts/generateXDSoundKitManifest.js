const fs = require('fs');
const path = require('path');

const xdBase = path.join(__dirname, '..', 'audio', 'XDSoundKit');
const manifest = [];
let id = 1;

// Helper function to process audio files in a directory
function processAudioDirectory(dirPath, categoryName, subcategory = '') {
    if (!fs.existsSync(dirPath)) {
        return;
    }
    
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    items.forEach(item => {
        if (item.isDirectory()) {
            // Recursively process subdirectories
            processAudioDirectory(path.join(dirPath, item.name), categoryName, item.name);
            return;
        }
        
        const file = item.name;
        const ext = path.extname(file).toLowerCase().slice(1);
        if (!['ogg', 'wav', 'mp3'].includes(ext)) return;
        
        const relativePath = path.relative(xdBase, path.join(dirPath, file));
        const filePath = path.join('audio', 'XDSoundKit', relativePath);
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);
        
        // Generate name from filename
        const baseName = path.basename(file, path.extname(file));
        const name = baseName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Generate tags from filename, category, and subcategory
        const tags = [];
        const lowerName = baseName.toLowerCase();
        const lowerCat = categoryName.toLowerCase();
        const lowerSubcat = subcategory.toLowerCase();
        
        // Add category-based tags
        tags.push(lowerCat);
        if (subcategory) tags.push(lowerSubcat);
        
        // Add library tag
        tags.push('xd soundkit', 'ui', 'notification', 'interface');
        
        // Category-specific tags
        if (lowerCat.includes('dings') || lowerCat.includes('dongs')) tags.push('ding', 'dong', 'bell', 'chime', 'notification');
        if (lowerCat.includes('swishes') || lowerCat.includes('swooshes')) tags.push('swish', 'swoosh', 'whoosh', 'sweep', 'movement');
        if (lowerCat.includes('tics') || lowerCat.includes('tacs')) tags.push('tic', 'tac', 'tick', 'clock', 'rhythm');
        if (lowerCat.includes('wums') || lowerCat.includes('wuhs')) tags.push('wum', 'wuh', 'warm', 'bass', 'soft');
        
        // Name-based tags
        if (lowerName.includes('ding')) tags.push('ding', 'bell', 'notification');
        if (lowerName.includes('double')) tags.push('double', 'two', 'multiple');
        if (lowerName.includes('triple')) tags.push('triple', 'three', 'multiple');
        if (lowerName.includes('two step')) tags.push('two step', 'staggered', 'double');
        if (lowerName.includes('low power')) tags.push('low power', 'warning', 'battery', 'alert');
        if (lowerName.includes('pleasant')) tags.push('pleasant', 'friendly', 'positive', 'happy');
        if (lowerName.includes('falling')) tags.push('falling', 'descending', 'down');
        if (lowerName.includes('rising')) tags.push('rising', 'ascending', 'up');
        if (lowerName.includes('steps')) tags.push('steps', 'staggered', 'sequence');
        if (lowerName.includes('stutter')) tags.push('stutter', 'repeating', 'staccato');
        if (lowerName.includes('uhoh') || lowerName.includes('uh oh')) tags.push('uh oh', 'warning', 'alert', 'mistake');
        if (lowerName.includes('up down up')) tags.push('up down up', 'bounce', 'playful');
        if (lowerName.includes('swipe')) tags.push('swipe', 'gesture', 'touch', 'mobile');
        if (lowerName.includes('back')) tags.push('back', 'navigation', 'return');
        if (lowerName.includes('swoosh')) tags.push('swoosh', 'sweep', 'movement');
        if (lowerName.includes('happy')) tags.push('happy', 'positive', 'cheerful', 'friendly');
        if (lowerName.includes('wish')) tags.push('wish', 'magical', 'sparkle');
        if (lowerName.includes('wisp')) tags.push('wisp', 'soft', 'gentle', 'light');
        if (lowerName.includes('gone with the wind')) tags.push('gone with the wind', 'long', 'sweep', 'wind');
        if (lowerName.includes('tictac') || lowerName.includes('tic tac')) tags.push('tic tac', 'clock', 'rhythm', 'tick');
        if (lowerName.includes('dial')) tags.push('dial', 'phone', 'rotate', 'adjust');
        if (lowerName.includes('fast')) tags.push('fast', 'quick', 'rapid');
        if (lowerName.includes('medium')) tags.push('medium', 'moderate', 'mid');
        if (lowerName.includes('slow')) tags.push('slow', 'leisurely', 'relaxed');
        if (lowerName.includes('drop')) tags.push('drop', 'fall', 'release');
        if (lowerName.includes('select')) tags.push('select', 'choose', 'pick', 'ui');
        if (lowerName.includes('warm')) tags.push('warm', 'soft', 'pleasant', 'comfortable');
        if (lowerName.includes('power')) tags.push('power', 'energy', 'strength');
        if (lowerName.includes('wobble')) tags.push('wobble', 'unstable', 'shake', 'vibration');
        
        // Remove duplicates
        const uniqueTags = [...new Set(tags)];
        
        manifest.push({
            id: id++,
            path: filePath,
            name: name,
            category: categoryName,
            format: ext,
            size: stats.size,
            duration: 0,
            rating: 0,
            tags: uniqueTags,
            description: name + ' from XDSoundKit ' + categoryName + ' collection.',
            library: 'XDSoundKit',
            dateAdded: new Date().toISOString()
        });
    });
}

// Get all subdirectories in XDSoundKit folder
const subdirs = fs.readdirSync(xdBase, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

console.log('Found subdirs:', subdirs);

// Process each subdirectory
subdirs.forEach(subdir => {
    console.log('Processing:', subdir);
    processAudioDirectory(path.join(xdBase, subdir), subdir);
});

// Write manifest
const outputPath = path.join(xdBase, 'manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log('Generated manifest with', manifest.length, 'entries at', outputPath);