const fs = require('fs');
const path = require('path');

const filmCowBase = path.join(__dirname, '..', 'audio', 'FilmCow');
const manifest = [];
let id = 1;

// Helper function to process audio files in a directory
function processAudioDirectory(dirPath, categoryName) {
    if (!fs.existsSync(dirPath)) {
        return;
    }
    
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    items.forEach(item => {
        if (item.isDirectory()) {
            // Recursively process subdirectories
            processAudioDirectory(path.join(dirPath, item.name), categoryName);
            return;
        }
        
        const file = item.name;
        const ext = path.extname(file).toLowerCase().slice(1);
        if (!['ogg', 'wav', 'mp3'].includes(ext)) return;
        
        const relativePath = path.relative(filmCowBase, path.join(dirPath, file));
        const filePath = path.join('audio', 'FilmCow', relativePath);
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);
        
        // Generate name from filename
        const baseName = path.basename(file, path.extname(file));
        const name = baseName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Generate tags from filename and category
        const tags = [];
        const lowerName = baseName.toLowerCase();
        
        // Add category-based tags
        if (categoryName.toLowerCase().includes('designed')) tags.push('designed', 'sfx');
        if (categoryName.toLowerCase().includes('recorded')) tags.push('recorded', 'foley');
        
        // Add name-based tags
        if (lowerName.includes('alien')) tags.push('alien', 'scifi');
        if (lowerName.includes('robot')) tags.push('robot', 'mechanical');
        if (lowerName.includes('laser')) tags.push('laser', 'weapon');
        if (lowerName.includes('space')) tags.push('space', 'scifi');
        if (lowerName.includes('sci fi') || lowerName.includes('sci-fi')) tags.push('scifi');
        if (lowerName.includes('bug')) tags.push('bug', 'insect');
        if (lowerName.includes('goo')) tags.push('goo', 'liquid', 'slime');
        if (lowerName.includes('ai')) tags.push('ai', 'computer', 'digital');
        if (lowerName.includes('computer')) tags.push('computer', 'digital');
        if (lowerName.includes('machine')) tags.push('machine', 'mechanical');
        if (lowerName.includes('footstep')) tags.push('footstep', 'walk');
        if (lowerName.includes('door')) tags.push('door', 'transition');
        if (lowerName.includes('glass')) tags.push('glass');
        if (lowerName.includes('metal')) tags.push('metal');
        if (lowerName.includes('wood')) tags.push('wood');
        if (lowerName.includes('water')) tags.push('water', 'liquid');
        if (lowerName.includes('splash')) tags.push('splash', 'water');
        if (lowerName.includes('paper')) tags.push('paper');
        if (lowerName.includes('gun')) tags.push('gun', 'weapon');
        if (lowerName.includes('punch')) tags.push('punch', 'combat');
        if (lowerName.includes('hit')) tags.push('hit', 'impact');
        if (lowerName.includes('drop')) tags.push('drop');
        if (lowerName.includes('bell')) tags.push('bell');
        if (lowerName.includes('click')) tags.push('click', 'ui');
        if (lowerName.includes('horn')) tags.push('horn');
        if (lowerName.includes('lightning')) tags.push('lightning', 'electric');
        if (lowerName.includes('thump')) tags.push('thump', 'impact');
        if (lowerName.includes('communication')) tags.push('communication', 'transmission');
        if (lowerName.includes('atmospheric')) tags.push('atmospheric', 'ambience');
        if (lowerName.includes('stinger')) tags.push('stinger', 'transition');
        if (lowerName.includes('ocean')) tags.push('ocean', 'water', 'ambience');
        if (lowerName.includes('wave')) tags.push('wave', 'water');
        if (lowerName.includes('toilet')) tags.push('toilet', 'bathroom');
        if (lowerName.includes('chair')) tags.push('chair', 'furniture');
        if (lowerName.includes('book')) tags.push('book');
        if (lowerName.includes('bottle')) tags.push('bottle');
        if (lowerName.includes('knife')) tags.push('knife', 'weapon');
        if (lowerName.includes('umbrella')) tags.push('umbrella');
        if (lowerName.includes('velcro')) tags.push('velcro');
        if (lowerName.includes('teapot')) tags.push('teapot', 'kitchen');
        if (lowerName.includes('silverware')) tags.push('silverware', 'kitchen');
        if (lowerName.includes('rock')) tags.push('rock', 'stone');
        if (lowerName.includes('leaf') || lowerName.includes('leaves')) tags.push('leaf', 'nature');
        if (lowerName.includes('grass')) tags.push('grass', 'nature');
        if (lowerName.includes('bush')) tags.push('bush', 'nature');
        if (lowerName.includes('swamp')) tags.push('swamp', 'nature', 'ambience');
        if (lowerName.includes('body')) tags.push('body', 'human');
        if (lowerName.includes('grunt')) tags.push('grunt', 'voice', 'human');
        if (lowerName.includes('oof')) tags.push('oof', 'voice', 'human');
        if (lowerName.includes('land')) tags.push('land', 'movement');
        if (lowerName.includes('fall')) tags.push('fall', 'movement');
        if (lowerName.includes('slap')) tags.push('slap', 'impact');
        if (lowerName.includes('sipping') || lowerName.includes('sip')) tags.push('sip', 'drink');
        if (lowerName.includes('button')) tags.push('button', 'ui');
        if (lowerName.includes('knob')) tags.push('knob', 'ui');
        if (lowerName.includes('drawer')) tags.push('drawer', 'furniture');
        if (lowerName.includes('crate')) tags.push('crate', 'container');
        if (lowerName.includes('cleaver')) tags.push('cleaver', 'kitchen', 'weapon');
        if (lowerName.includes('fish')) tags.push('fish', 'animal');
        if (lowerName.includes('flag')) tags.push('flag', 'fabric');
        if (lowerName.includes('foam')) tags.push('foam');
        if (lowerName.includes('fudge')) tags.push('fudge', 'food');
        if (lowerName.includes('gas')) tags.push('gas', 'liquid');
        if (lowerName.includes('harpoon')) tags.push('harpoon', 'weapon');
        if (lowerName.includes('beverage')) tags.push('beverage', 'drink');
        if (lowerName.includes('phone')) tags.push('phone', 'electronic');
        if (lowerName.includes('mouse')) tags.push('mouse', 'electronic');
        if (lowerName.includes('orange')) tags.push('orange', 'food');
        if (lowerName.includes('party')) tags.push('party', 'celebration');
        if (lowerName.includes('ping pong')) tags.push('pingpong', 'sport');
        if (lowerName.includes('plastic')) tags.push('plastic');
        if (lowerName.includes('plate')) tags.push('plate', 'kitchen');
        if (lowerName.includes('rumbling')) tags.push('rumbling', 'ambience');
        if (lowerName.includes('sheet')) tags.push('sheet', 'fabric');
        if (lowerName.includes('spatula')) tags.push('spatula', 'kitchen');
        if (lowerName.includes('spray')) tags.push('spray', 'liquid');
        if (lowerName.includes('tube')) tags.push('tube');
        if (lowerName.includes('future')) tags.push('future', 'scifi');
        if (lowerName.includes('presence')) tags.push('presence', 'ambience');
        if (lowerName.includes('talking')) tags.push('talking', 'voice');
        if (lowerName.includes('sick')) tags.push('sick', 'voice');
        if (lowerName.includes('freaking')) tags.push('malfunction');
        
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
            description: name + ' from FilmCow ' + categoryName + ' collection.',
            library: 'FilmCow',
            dateAdded: new Date().toISOString()
        });
    });
}

// Get all subdirectories in FilmCow folder
const subdirs = fs.readdirSync(filmCowBase, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

console.log('Found subdirs:', subdirs);

// Process each subdirectory
subdirs.forEach(subdir => {
    // Get category name from folder name
    let categoryName = subdir.replace('FilmCow ', '').replace(/\b\w/g, l => l.toUpperCase());
    
    const subdirPath = path.join(filmCowBase, subdir);
    console.log('Processing:', subdir);
    processAudioDirectory(subdirPath, categoryName);
});

// Write manifest
const outputPath = path.join(filmCowBase, 'manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log('Generated manifest with', manifest.length, 'entries at', outputPath);