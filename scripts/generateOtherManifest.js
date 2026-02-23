const fs = require('fs');
const path = require('path');

const otherBase = path.join(__dirname, '..', 'audio', 'Other');
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
        
        const relativePath = path.relative(otherBase, path.join(dirPath, file));
        const filePath = path.join('audio', 'Other', relativePath);
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
        tags.push('retro', 'game music', 'soundtrack');
        
        // Game-specific tags
        if (lowerName.includes('bomb jack')) tags.push('bomb jack', 'arcade', 'platformer', 'mark cooksey');
        if (lowerName.includes('frankie goes to hollywood')) tags.push('frankie goes to hollywood', 'fred gray', 'c64', 'commodore');
        if (lowerName.includes('hyper sports')) tags.push('hyper sports', 'martin galway', 'sports', 'olympic');
        if (lowerName.includes('lazy jones')) tags.push('lazy jones', 'david whittaker', 'c64', 'commodore');
        if (lowerName.includes('super mario')) tags.push('super mario', 'koji kondo', 'nintendo', 'nes');
        if (lowerName.includes('yie ar kung fu')) tags.push('yie ar kung fu', 'martin galway', 'fighting', 'arcade');
        
        // Composer tags
        if (lowerName.includes('mark cooksey')) tags.push('mark cooksey', 'composer');
        if (lowerName.includes('fred gray')) tags.push('fred gray', 'composer');
        if (lowerName.includes('martin galway')) tags.push('martin galway', 'composer');
        if (lowerName.includes('david whittaker')) tags.push('david whittaker', 'composer');
        if (lowerName.includes('koji kondo')) tags.push('koji kondo', 'composer');
        
        // Track type tags
        if (lowerName.includes('theme') || lowerName.includes('title')) tags.push('theme', 'title', 'menu');
        if (lowerName.includes('in-game') || lowerName.includes('ingame')) tags.push('in-game', 'gameplay', 'background');
        if (lowerName.includes('loop')) tags.push('loop', 'repeating');
        if (lowerName.includes('sting') || lowerName.includes('stinger')) tags.push('sting', 'stinger', 'short', 'jingle');
        if (lowerName.includes('string')) tags.push('string', 'synth', 'melody');
        if (lowerName.includes('complete') || lowerName.includes('complete sting')) tags.push('complete', 'success', 'victory');
        if (lowerName.includes('game over')) tags.push('game over', 'fail', 'end');
        if (lowerName.includes('level complete') || lowerName.includes('level')) tags.push('level', 'stage', 'complete');
        if (lowerName.includes('song')) tags.push('song', 'track', 'music');
        
        // Super Mario specific tags
        if (lowerName.includes('castle')) tags.push('castle', 'dungeon', 'boss');
        if (lowerName.includes('overworld')) tags.push('overworld', 'main', 'outdoor');
        if (lowerName.includes('underwater')) tags.push('underwater', 'swimming', 'water');
        if (lowerName.includes('underworld')) tags.push('underworld', 'underground', 'cave');
        if (lowerName.includes('princess') || lowerName.includes('peach')) tags.push('princess', 'peach', 'ending', 'victory');
        if (lowerName.includes('superstar')) tags.push('superstar', 'powerup', 'star');
        if (lowerName.includes('time')) tags.push('time', 'warning', 'urgent');
        if (lowerName.includes('lose a life')) tags.push('lose a life', 'death', 'fail');
        if (lowerName.includes('full mix')) tags.push('full mix', 'complete', 'arrangement');
        if (lowerName.includes('pulse channel')) tags.push('pulse channel', 'chiptune', 'nes', 'channel');
        if (lowerName.includes('triangle channel') || lowerName.includes('triangle wave')) tags.push('triangle', 'bass', 'nes', 'channel');
        if (lowerName.includes('noise channel')) tags.push('noise', 'percussion', 'drums', 'nes');
        
        // Yie Ar Kung Fu specific tags
        if (lowerName.includes('kung fu')) tags.push('kung fu', 'fighting', 'martial arts');
        if (lowerName.includes('level start')) tags.push('level start', 'begin', 'intro');
        if (lowerName.includes('level complete')) tags.push('level complete', 'victory', 'success');
        
        // Hyper Sports specific tags
        if (lowerName.includes('sports')) tags.push('sports', 'athletics', 'competition');
        
        // Lazy Jones specific tags
        if (lowerName.includes('lazy')) tags.push('lazy', 'relaxed', 'casual');
        
        // Frankie Goes to Hollywood specific tags
        if (lowerName.includes('flower power')) tags.push('flower power', 'theme', 'psychedelic');
        if (lowerName.includes('sobre las olas')) tags.push('sobre las olas', 'classical', 'waltz');
        
        // Style/influence tags
        if (lowerName.includes('magnetic fields')) tags.push('magnetic fields', 'influence');
        if (lowerName.includes('jean-michel jarre')) tags.push('jean-michel jarre', 'synth', 'electronic', 'influence');
        
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
            description: name + ' from Other ' + categoryName + ' collection.',
            library: 'Other',
            dateAdded: new Date().toISOString()
        });
    });
}

// Get all subdirectories in Other folder
const subdirs = fs.readdirSync(otherBase, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

console.log('Found subdirs:', subdirs);

// Process each subdirectory
subdirs.forEach(subdir => {
    console.log('Processing:', subdir);
    processAudioDirectory(path.join(otherBase, subdir), subdir);
});

// Write manifest
const outputPath = path.join(otherBase, 'manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log('Generated manifest with', manifest.length, 'entries at', outputPath);