const fs = require('fs');
const path = require('path');

const adobeBase = path.join(__dirname, '..', 'audio', 'Adobe');
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
        
        const relativePath = path.relative(adobeBase, path.join(dirPath, file));
        const filePath = path.join('audio', 'Adobe', relativePath);
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
        
        // Add name-based tags
        if (lowerName.includes('alert') || lowerName.includes('alarm')) tags.push('alert', 'notification', 'warning');
        if (lowerName.includes('beep')) tags.push('beep', 'digital', 'ui');
        if (lowerName.includes('cartoon')) tags.push('cartoon', 'animated', 'playful');
        if (lowerName.includes('transition')) tags.push('transition', 'effect');
        if (lowerName.includes('weapon')) tags.push('weapon', 'combat');
        if (lowerName.includes('explosion')) tags.push('explosion', 'impact', 'combat');
        if (lowerName.includes('laser')) tags.push('laser', 'scifi', 'weapon');
        if (lowerName.includes('digital')) tags.push('digital', 'electronic');
        if (lowerName.includes('multimedia')) tags.push('multimedia', 'digital', 'ui');
        if (lowerName.includes('flash')) tags.push('flash', 'digital', 'web');
        if (lowerName.includes('animation')) tags.push('animation', 'cartoon');
        if (lowerName.includes('toy')) tags.push('toy', 'playful');
        if (lowerName.includes('whistle')) tags.push('whistle', 'sound');
        if (lowerName.includes('horn')) tags.push('horn', 'instrument');
        if (lowerName.includes('balloon')) tags.push('balloon', 'toy');
        if (lowerName.includes('kiss')) tags.push('kiss', 'human', 'cartoon');
        if (lowerName.includes('voice')) tags.push('voice', 'human');
        if (lowerName.includes('squeak')) tags.push('squeak', 'toy');
        if (lowerName.includes('drum')) tags.push('drum', 'percussion', 'instrument');
        if (lowerName.includes('cymbal')) tags.push('cymbal', 'percussion', 'instrument');
        if (lowerName.includes('bell')) tags.push('bell', 'notification', 'chime');
        if (lowerName.includes('chime')) tags.push('chime', 'bell', 'notification');
        if (lowerName.includes('blast')) tags.push('blast', 'impact', 'explosion');
        if (lowerName.includes('crystal')) tags.push('crystal', 'magical', 'effect');
        if (lowerName.includes('glow')) tags.push('glow', 'magical', 'effect');
        if (lowerName.includes('data')) tags.push('data', 'digital', 'computer');
        if (lowerName.includes('transmission')) tags.push('transmission', 'digital', 'communication');
        if (lowerName.includes('computer')) tags.push('computer', 'digital', 'technology');
        if (lowerName.includes('axe')) tags.push('axe', 'weapon', 'melee');
        if (lowerName.includes('sword')) tags.push('sword', 'weapon', 'melee');
        if (lowerName.includes('bullet')) tags.push('bullet', 'weapon', 'ammo');
        if (lowerName.includes('cannon')) tags.push('cannon', 'weapon', 'explosion');
        if (lowerName.includes('gun')) tags.push('gun', 'weapon', 'firearm');
        if (lowerName.includes('rifle')) tags.push('rifle', 'weapon', 'firearm');
        if (lowerName.includes('shotgun')) tags.push('shotgun', 'weapon', 'firearm');
        if (lowerName.includes('machine gun')) tags.push('machine gun', 'weapon', 'firearm');
        if (lowerName.includes('knife')) tags.push('knife', 'weapon', 'melee');
        if (lowerName.includes('whip')) tags.push('whip', 'weapon');
        if (lowerName.includes('taser')) tags.push('taser', 'weapon', 'electric');
        if (lowerName.includes('character')) tags.push('character', 'animator');
        if (lowerName.includes('ambience')) tags.push('ambience', 'background', 'environment');
        if (lowerName.includes('footstep')) tags.push('footstep', 'foley', 'walk');
        if (lowerName.includes('door')) tags.push('door', 'foley', 'transition');
        if (lowerName.includes('fire')) tags.push('fire', 'effect', 'nature');
        if (lowerName.includes('fireball')) tags.push('fireball', 'fire', 'magic');
        if (lowerName.includes('horror')) tags.push('horror', 'scary', 'dark');
        if (lowerName.includes('ghost')) tags.push('ghost', 'horror', 'scary');
        if (lowerName.includes('scream')) tags.push('scream', 'horror', 'human');
        if (lowerName.includes('glass')) tags.push('glass', 'foley', 'break');
        if (lowerName.includes('paper')) tags.push('paper', 'foley');
        if (lowerName.includes('shower')) tags.push('shower', 'household', 'water');
        if (lowerName.includes('crowd')) tags.push('crowd', 'human', 'group');
        if (lowerName.includes('cheer')) tags.push('cheer', 'crowd', 'celebration');
        if (lowerName.includes('water')) tags.push('water', 'liquid', 'nature');
        if (lowerName.includes('splash')) tags.push('splash', 'water', 'liquid');
        if (lowerName.includes('bubble')) tags.push('bubble', 'water', 'liquid');
        if (lowerName.includes('scifi') || lowerName.includes('sci-fi')) tags.push('scifi', 'futuristic', 'technology');
        if (lowerName.includes('alien')) tags.push('alien', 'scifi', 'creature');
        if (lowerName.includes('spaceship') || lowerName.includes('space ship')) tags.push('spaceship', 'scifi', 'vehicle');
        if (lowerName.includes('saber')) tags.push('saber', 'scifi', 'weapon');
        if (lowerName.includes('sports')) tags.push('sports', 'game');
        if (lowerName.includes('baseball')) tags.push('baseball', 'sports', 'game');
        if (lowerName.includes('basketball')) tags.push('basketball', 'sports', 'game');
        if (lowerName.includes('football')) tags.push('football', 'sports', 'game');
        if (lowerName.includes('arcade')) tags.push('arcade', 'game', 'retro');
        if (lowerName.includes('keyboard')) tags.push('keyboard', 'computer', 'typing');
        if (lowerName.includes('cell phone') || lowerName.includes('phone')) tags.push('phone', 'mobile', 'communication');
        if (lowerName.includes('car')) tags.push('car', 'vehicle', 'transportation');
        if (lowerName.includes('truck')) tags.push('truck', 'vehicle', 'transportation');
        if (lowerName.includes('drive')) tags.push('drive', 'vehicle', 'transportation');
        if (lowerName.includes('thunder')) tags.push('thunder', 'weather', 'storm');
        if (lowerName.includes('lightning')) tags.push('lightning', 'weather', 'storm');
        if (lowerName.includes('storm')) tags.push('storm', 'weather', 'nature');
        if (lowerName.includes('wind')) tags.push('wind', 'weather', 'nature');
        if (lowerName.includes('bleep')) tags.push('bleep', 'digital', 'ui');
        if (lowerName.includes('cute')) tags.push('cute', 'playful', 'friendly');
        if (lowerName.includes('woosh') || lowerName.includes('whoosh')) tags.push('woosh', 'movement', 'effect');
        if (lowerName.includes('mouth')) tags.push('mouth', 'vocal', 'human');
        if (lowerName.includes('readout')) tags.push('readout', 'digital', 'computer');
        if (lowerName.includes('hooray')) tags.push('hooray', 'celebration', 'human');
        if (lowerName.includes('motionsound')) tags.push('motionsound', 'sound effect');
        
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
            description: name + ' from Adobe ' + categoryName + ' collection.',
            library: 'Adobe',
            dateAdded: new Date().toISOString()
        });
    });
}

// Get all subdirectories in Adobe folder
const subdirs = fs.readdirSync(adobeBase, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

console.log('Found subdirs:', subdirs);

// Process each subdirectory
subdirs.forEach(subdir => {
    // Generate category name from folder name
    let categoryName = subdir.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Clean up category names
    if (categoryName.includes('Adobe Sound Effects')) {
        categoryName = categoryName.replace('Adobe Sound Effects ', '');
    }
    
    console.log('Processing:', subdir, 'as category:', categoryName);
    processAudioDirectory(path.join(adobeBase, subdir), categoryName);
});

// Write manifest
const outputPath = path.join(adobeBase, 'manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log('Generated manifest with', manifest.length, 'entries at', outputPath);
