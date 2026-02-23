const fs = require('fs');
const path = require('path');

const amigaBase = path.join(__dirname, '..', 'audio', 'Amiga Music');
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
        
        const relativePath = path.relative(amigaBase, path.join(dirPath, file));
        const filePath = path.join('audio', 'Amiga Music', relativePath);
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
        tags.push('amiga', 'retro', 'chiptune', 'synth');
        
        // Add name-based tags
        if (lowerName.includes('game music') || lowerName.includes('game')) tags.push('game', 'soundtrack');
        if (lowerName.includes('mod')) tags.push('mod', 'module', 'tracker');
        if (lowerName.includes('title') || lowerName.includes('theme')) tags.push('title', 'theme', 'menu');
        if (lowerName.includes('intro')) tags.push('intro', 'opening');
        if (lowerName.includes('main')) tags.push('main', 'theme');
        if (lowerName.includes('boss')) tags.push('boss', 'battle', 'combat');
        if (lowerName.includes('level') || lowerName.includes('stage')) tags.push('level', 'stage', 'gameplay');
        if (lowerName.includes('game over')) tags.push('game over', 'fail', 'gameplay');
        if (lowerName.includes('complete') || lowerName.includes('clear')) tags.push('complete', 'success', 'victory');
        if (lowerName.includes('ending')) tags.push('ending', 'finale', 'victory');
        if (lowerName.includes('intermission')) tags.push('intermission', 'break');
        if (lowerName.includes('loading')) tags.push('loading', 'wait');
        if (lowerName.includes('get ready')) tags.push('get ready', 'start');
        if (lowerName.includes('try again')) tags.push('try again', 'retry', 'fail');
        if (lowerName.includes('mission')) tags.push('mission', 'objective');
        if (lowerName.includes('phase')) tags.push('phase', 'level');
        
        // Game-specific tags
        if (lowerName.includes('batman')) tags.push('batman', 'superhero', 'action');
        if (lowerName.includes('battletoads')) tags.push('battletoads', 'action', 'platformer');
        if (lowerName.includes('blood money')) tags.push('blood money', 'shooter');
        if (lowerName.includes('cannon fodder')) tags.push('cannon fodder', 'strategy', 'war');
        if (lowerName.includes('flashback')) tags.push('flashback', 'platformer', 'scifi');
        if (lowerName.includes('full contact')) tags.push('full contact', 'fighting');
        if (lowerName.includes('lotus')) tags.push('lotus', 'racing', 'driving');
        if (lowerName.includes('pinball')) tags.push('pinball', 'arcade');
        if (lowerName.includes('r-type')) tags.push('r-type', 'shooter', 'scifi');
        if (lowerName.includes('shadow of the beast')) tags.push('shadow of the beast', 'platformer', 'dark');
        if (lowerName.includes('speedball')) tags.push('speedball', 'sports', 'futuristic');
        
        // MOD artist tags
        if (lowerName.includes('dr awesome') || lowerName.includes('bjørn lynne')) tags.push('dr awesome', 'bjørn lynne');
        if (lowerName.includes('jester')) tags.push('jester', 'demo scene');
        if (lowerName.includes('pirat')) tags.push('pirat', 'demo scene');
        if (lowerName.includes('tdk') || lowerName.includes('mark knight')) tags.push('tdk', 'mark knight', 'demo scene');
        
        // Music style tags
        if (lowerName.includes('course') || lowerName.includes('track')) tags.push('track', 'level');
        if (lowerName.includes('desert')) tags.push('desert', 'environment');
        if (lowerName.includes('forest')) tags.push('forest', 'nature');
        if (lowerName.includes('night')) tags.push('night', 'dark');
        if (lowerName.includes('snow')) tags.push('snow', 'winter');
        if (lowerName.includes('storm')) tags.push('storm', 'weather');
        if (lowerName.includes('fog')) tags.push('fog', 'atmosphere');
        if (lowerName.includes('motorway')) tags.push('motorway', 'road', 'driving');
        if (lowerName.includes('cathedral')) tags.push('cathedral', 'gothic', 'building');
        if (lowerName.includes('cave') || lowerName.includes('cavern')) tags.push('cave', 'underground');
        if (lowerName.includes('factory')) tags.push('factory', 'industrial');
        if (lowerName.includes('street')) tags.push('street', 'city', 'urban');
        if (lowerName.includes('womb') || lowerName.includes('inside')) tags.push('organic', 'interior');
        if (lowerName.includes('dream') || lowerName.includes('island')) tags.push('dream', 'fantasy');
        if (lowerName.includes('arctic') || lowerName.includes('ice')) tags.push('arctic', 'ice', 'cold');
        if (lowerName.includes('volcano') || lowerName.includes('inferno')) tags.push('fire', 'hot', 'danger');
        if (lowerName.includes('surf')) tags.push('surf', 'water', 'beach');
        if (lowerName.includes('revolution')) tags.push('revolution', 'action');
        if (lowerName.includes('turbo')) tags.push('turbo', 'fast', 'speed');
        if (lowerName.includes('karnath') || lowerName.includes('lair')) tags.push('lair', 'boss', 'danger');
        if (lowerName.includes('clinger') || lowerName.includes('winger')) tags.push('action', 'platformer');
        if (lowerName.includes('rat race')) tags.push('rat race', 'chase');
        if (lowerName.includes('wookie')) tags.push('wookie', 'hole', 'cave');
        if (lowerName.includes('volkmire')) tags.push('volkmire', 'fire', 'danger');
        if (lowerName.includes('intruder') || lowerName.includes('excluder')) tags.push('action', 'platformer');
        if (lowerName.includes('terra tubes')) tags.push('terra', 'tubes', 'underground');
        
        // Pinball Dreams tables
        if (lowerName.includes('beat box')) tags.push('beat box', 'hip hop', 'urban');
        if (lowerName.includes('ignition')) tags.push('ignition', 'space', 'rocket');
        if (lowerName.includes('nightmare')) tags.push('nightmare', 'dark', 'horror');
        if (lowerName.includes('steel wheels')) tags.push('steel wheels', 'train', 'industrial');
        
        // Flashback locations
        if (lowerName.includes('belt')) tags.push('belt', 'item');
        if (lowerName.includes('chute')) tags.push('chute', 'slide');
        if (lowerName.includes('conrad')) tags.push('conrad', 'protagonist', 'character');
        if (lowerName.includes('memories')) tags.push('memories', 'flashback', 'story');
        if (lowerName.includes('delphine')) tags.push('delphine', 'logo', 'studio');
        if (lowerName.includes('disintegration')) tags.push('disintegration', 'effect', 'scifi');
        if (lowerName.includes('elevator')) tags.push('elevator', 'transport', 'mechanical');
        if (lowerName.includes('fanfare')) tags.push('fanfare', 'triumph', 'celebration');
        if (lowerName.includes('holocube')) tags.push('holocube', 'scifi', 'item');
        if (lowerName.includes('teleport')) tags.push('teleport', 'scifi', 'effect');
        if (lowerName.includes('taxi')) tags.push('taxi', 'vehicle', 'transport');
        if (lowerName.includes('voyage')) tags.push('voyage', 'journey', 'travel');
        if (lowerName.includes('waking')) tags.push('waking', 'awakening', 'start');
        if (lowerName.includes('reunion')) tags.push('reunion', 'story', 'emotional');
        
        // MOD style tags
        if (lowerName.includes('acidic') || lowerName.includes('acid')) tags.push('acid', 'electronic');
        if (lowerName.includes('chip') || lowerName.includes('chipper')) tags.push('chip', 'chiptune');
        if (lowerName.includes('cyber')) tags.push('cyber', 'electronic', 'scifi');
        if (lowerName.includes('molecule')) tags.push('molecule', 'science');
        if (lowerName.includes('wicked')) tags.push('wicked', 'intense');
        if (lowerName.includes('instinct')) tags.push('instinct', 'primal');
        if (lowerName.includes('melon')) tags.push('melon', 'playful');
        if (lowerName.includes('grind')) tags.push('grind', 'industrial');
        if (lowerName.includes('frequency')) tags.push('frequency', 'electronic');
        if (lowerName.includes('space')) tags.push('space', 'cosmic', 'scifi');
        if (lowerName.includes('deliria') || lowerName.includes('delirium')) tags.push('delirium', 'trippy');
        if (lowerName.includes('hightop')) tags.push('hightop', 'energetic');
        if (lowerName.includes('back in town')) tags.push('back in town', 'return');
        if (lowerName.includes('escape')) tags.push('escape', 'action', 'chase');
        if (lowerName.includes('suicide')) tags.push('suicide', 'dark', 'intense');
        if (lowerName.includes('normal')) tags.push('normal', 'standard');
        if (lowerName.includes('distance')) tags.push('distance', 'separation');
        if (lowerName.includes('orgasmic')) tags.push('orgasmic', 'anthrox', 'remix');
        if (lowerName.includes('chubby')) tags.push('chubby', 'playful');
        
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
            description: name + ' from Amiga Music ' + categoryName + ' collection.',
            library: 'Amiga Music',
            dateAdded: new Date().toISOString()
        });
    });
}

// Get all subdirectories in Amiga Music folder
const subdirs = fs.readdirSync(amigaBase, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

console.log('Found subdirs:', subdirs);

// Process each subdirectory
subdirs.forEach(subdir => {
    console.log('Processing:', subdir);
    processAudioDirectory(path.join(amigaBase, subdir), subdir);
});

// Write manifest
const outputPath = path.join(amigaBase, 'manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log('Generated manifest with', manifest.length, 'entries at', outputPath);