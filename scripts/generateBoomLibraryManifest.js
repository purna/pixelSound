const fs = require('fs');
const path = require('path');

const boomBase = path.join(__dirname, '..', 'audio', 'BoomLibrary');
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
        
        const relativePath = path.relative(boomBase, path.join(dirPath, file));
        const filePath = path.join('audio', 'BoomLibrary', relativePath);
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
        tags.push('boom library', 'professional', 'cinematic');
        
        // Category-specific tags
        if (lowerCat.includes('cinematic hits')) tags.push('hit', 'impact', 'cinematic');
        if (lowerCat.includes('cinematic metal')) tags.push('metal', 'impact', 'cinematic');
        if (lowerCat.includes('cinematic trailers')) tags.push('trailer', 'cinematic', 'epic');
        if (lowerCat.includes('construction kit')) tags.push('construction kit', 'source', 'raw');
        if (lowerCat.includes('designed')) tags.push('designed', 'processed', 'ready');
        if (lowerCat.includes('impacts')) tags.push('impact', 'hit', 'collision');
        
        // Name-based tags
        if (lowerName.includes('boom')) tags.push('boom', 'low', 'impact');
        if (lowerName.includes('hit')) tags.push('hit', 'impact', 'strike');
        if (lowerName.includes('drum')) tags.push('drum', 'percussion', 'rhythm');
        if (lowerName.includes('element')) tags.push('element', 'source');
        if (lowerName.includes('fire')) tags.push('fire', 'flame', 'heat');
        if (lowerName.includes('metal')) tags.push('metal', 'steel', 'iron');
        if (lowerName.includes('crash')) tags.push('crash', 'collision', 'impact');
        if (lowerName.includes('chain')) tags.push('chain', 'metal', 'rattle');
        if (lowerName.includes('smash')) tags.push('smash', 'destruction', 'impact');
        if (lowerName.includes('damper')) tags.push('damper', 'metal', 'resonance');
        if (lowerName.includes('gas')) tags.push('gas', 'industrial', 'pressure');
        if (lowerName.includes('bottle')) tags.push('bottle', 'container', 'metal');
        if (lowerName.includes('wood')) tags.push('wood', 'timber', 'organic');
        if (lowerName.includes('table')) tags.push('table', 'furniture', 'wood');
        if (lowerName.includes('distorted')) tags.push('distorted', 'processed', 'gritty');
        if (lowerName.includes('massive')) tags.push('massive', 'large', 'heavy');
        if (lowerName.includes('scifi') || lowerName.includes('sci-fi')) tags.push('scifi', 'futuristic', 'technology');
        if (lowerName.includes('slam')) tags.push('slam', 'impact', 'forceful');
        if (lowerName.includes('bell')) tags.push('bell', 'chime', 'metal');
        if (lowerName.includes('car')) tags.push('car', 'vehicle', 'automotive');
        if (lowerName.includes('hood')) tags.push('hood', 'car', 'metal');
        if (lowerName.includes('container')) tags.push('container', 'metal', 'industrial');
        if (lowerName.includes('door')) tags.push('door', 'metal', 'opening');
        if (lowerName.includes('pole')) tags.push('pole', 'metal', 'rod');
        if (lowerName.includes('iron')) tags.push('iron', 'metal', 'heavy');
        if (lowerName.includes('hammer')) tags.push('hammer', 'tool', 'impact');
        if (lowerName.includes('bicycle')) tags.push('bicycle', 'vehicle', 'transport');
        if (lowerName.includes('piano')) tags.push('piano', 'instrument', 'keys');
        if (lowerName.includes('sustained')) tags.push('sustained', 'ringing', 'resonance');
        if (lowerName.includes('plate')) tags.push('plate', 'metal', 'sheet');
        if (lowerName.includes('sheet')) tags.push('sheet', 'metal', 'thin');
        if (lowerName.includes('slidedoor')) tags.push('slide door', 'mechanism', 'metal');
        if (lowerName.includes('trash')) tags.push('trash', 'garbage', 'metal');
        if (lowerName.includes('rattle')) tags.push('rattle', 'shake', 'metal');
        if (lowerName.includes('hollow')) tags.push('hollow', 'empty', 'resonant');
        if (lowerName.includes('crate')) tags.push('crate', 'box', 'container');
        if (lowerName.includes('cavern')) tags.push('cavern', 'cave', 'reverb');
        if (lowerName.includes('flame')) tags.push('flame', 'fire', 'breath');
        if (lowerName.includes('meteorite')) tags.push('meteorite', 'space', 'impact');
        if (lowerName.includes('wobbler')) tags.push('wobbler', 'unstable', 'vibration');
        if (lowerName.includes('anvil')) tags.push('anvil', 'metal', 'forge');
        if (lowerName.includes('angry')) tags.push('angry', 'aggressive', 'intense');
        if (lowerName.includes('aquaphone')) tags.push('aquaphone', 'water', 'instrument');
        if (lowerName.includes('harsh')) tags.push('harsh', 'gritty', 'aggressive');
        if (lowerName.includes('glass')) tags.push('glass', 'fragile', 'break');
        if (lowerName.includes('debris')) tags.push('debris', 'fragments', 'scattered');
        if (lowerName.includes('orchestra')) tags.push('orchestra', 'symphonic', 'cinematic');
        if (lowerName.includes('grancassa')) tags.push('grancassa', 'drum', 'orchestral');
        if (lowerName.includes('synth')) tags.push('synth', 'electronic', 'synthesizer');
        if (lowerName.includes('voice')) tags.push('voice', 'vocal', 'human');
        if (lowerName.includes('choir')) tags.push('choir', 'vocal', 'group');
        if (lowerName.includes('whisper')) tags.push('whisper', 'voice', 'soft');
        if (lowerName.includes('rise')) tags.push('rise', 'building', 'tension');
        if (lowerName.includes('tutti')) tags.push('tutti', 'orchestra', 'full');
        if (lowerName.includes('chaos')) tags.push('chaos', 'disorder', 'intense');
        if (lowerName.includes('stinger')) tags.push('stinger', 'hit', 'short');
        if (lowerName.includes('fast')) tags.push('fast', 'quick', 'rapid');
        if (lowerName.includes('whoosh')) tags.push('whoosh', 'sweep', 'movement');
        if (lowerName.includes('torch')) tags.push('torch', 'fire', 'flame');
        if (lowerName.includes('flange')) tags.push('flange', 'effect', 'processed');
        if (lowerName.includes('speaker')) tags.push('speaker', 'audio', 'electronic');
        if (lowerName.includes('creature')) tags.push('creature', 'monster', 'beast');
        if (lowerName.includes('big')) tags.push('big', 'large', 'massive');
        if (lowerName.includes('war')) tags.push('war', 'battle', 'combat');
        if (lowerName.includes('stomp')) tags.push('stomp', 'foot', 'impact');
        if (lowerName.includes('silverwind')) tags.push('silverwind', 'ethereal', 'sweep');
        if (lowerName.includes('brass')) tags.push('brass', 'instrument', 'metal');
        if (lowerName.includes('demon')) tags.push('demon', 'dark', 'evil');
        if (lowerName.includes('firesworn')) tags.push('firesworn', 'fire', 'magical');
        if (lowerName.includes('arnigator')) tags.push('arnigator', 'creature', 'aggressive');
        if (lowerName.includes('soft')) tags.push('soft', 'gentle', 'subtle');
        if (lowerName.includes('slightly')) tags.push('slightly', 'subtle', 'light');
        if (lowerName.includes('impact')) tags.push('impact', 'hit', 'collision');
        if (lowerName.includes('low')) tags.push('low', 'bass', 'deep');
        if (lowerName.includes('mid')) tags.push('mid', 'medium', 'middle');
        if (lowerName.includes('high')) tags.push('high', 'treble', 'bright');
        if (lowerName.includes('loose')) tags.push('loose', 'relaxed', 'free');
        if (lowerName.includes('long')) tags.push('long', 'extended', 'sustained');
        if (lowerName.includes('large')) tags.push('large', 'big', 'massive');
        if (lowerName.includes('medium')) tags.push('medium', 'mid', 'average');
        if (lowerName.includes('small')) tags.push('small', 'little', 'tiny');
        
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
            description: name + ' from Boom Library ' + categoryName + ' collection.',
            library: 'BoomLibrary',
            dateAdded: new Date().toISOString()
        });
    });
}

// Get all subdirectories in BoomLibrary folder
const subdirs = fs.readdirSync(boomBase, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

console.log('Found subdirs:', subdirs);

// Process each subdirectory
subdirs.forEach(subdir => {
    console.log('Processing:', subdir);
    processAudioDirectory(path.join(boomBase, subdir), subdir);
});

// Write manifest
const outputPath = path.join(boomBase, 'manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log('Generated manifest with', manifest.length, 'entries at', outputPath);