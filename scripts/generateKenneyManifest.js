const fs = require('fs');
const path = require('path');

const kenneyBase = path.join(__dirname, '..', 'audio', 'Kenney');
const manifest = [];
let id = 1;

// Helper function to process audio files in a directory
function processAudioDirectory(audioPath, categoryName, subcategory = '') {
    if (!fs.existsSync(audioPath)) {
        return;
    }
    
    const files = fs.readdirSync(audioPath);
    files.forEach(file => {
        const ext = path.extname(file).toLowerCase().slice(1);
        if (!['ogg', 'wav', 'mp3'].includes(ext)) return;
        
        const relativePath = path.relative(kenneyBase, path.join(audioPath, file));
        const filePath = path.join('audio', 'Kenney', relativePath);
        const fullPath = path.join(audioPath, file);
        const stats = fs.statSync(fullPath);
        
        // Generate name from filename
        const baseName = path.basename(file, path.extname(file));
        const name = baseName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Generate tags from filename and category
        const tags = [];
        const lowerName = baseName.toLowerCase();
        
        // Add category-based tags
        if (categoryName.toLowerCase().includes('impact')) tags.push('impact', 'hit');
        if (categoryName.toLowerCase().includes('interface')) tags.push('ui', 'interface');
        if (categoryName.toLowerCase().includes('rpg')) tags.push('rpg', 'fantasy');
        if (categoryName.toLowerCase().includes('sci-fi')) tags.push('scifi', 'futuristic');
        if (categoryName.toLowerCase().includes('digital')) tags.push('digital', 'retro');
        if (categoryName.toLowerCase().includes('ui')) tags.push('ui', 'interface');
        if (categoryName.toLowerCase().includes('voiceover')) tags.push('voiceover', 'voice');
        
        // Add subcategory tags
        if (subcategory.toLowerCase() === 'male') tags.push('male', 'voice');
        if (subcategory.toLowerCase() === 'female') tags.push('female', 'voice');
        
        // Add name-based tags
        if (lowerName.includes('footstep')) tags.push('footstep', 'walk');
        if (lowerName.includes('door')) tags.push('door', 'transition');
        if (lowerName.includes('laser')) tags.push('laser', 'weapon');
        if (lowerName.includes('engine')) tags.push('engine', 'machine');
        if (lowerName.includes('explosion')) tags.push('explosion');
        if (lowerName.includes('click')) tags.push('click');
        if (lowerName.includes('switch')) tags.push('switch');
        if (lowerName.includes('metal')) tags.push('metal');
        if (lowerName.includes('glass')) tags.push('glass');
        if (lowerName.includes('wood')) tags.push('wood');
        if (lowerName.includes('book')) tags.push('book');
        if (lowerName.includes('cloth')) tags.push('cloth', 'fabric');
        if (lowerName.includes('knife')) tags.push('knife', 'weapon');
        if (lowerName.includes('coin')) tags.push('coin', 'money');
        if (lowerName.includes('carpet')) tags.push('carpet');
        if (lowerName.includes('concrete')) tags.push('concrete');
        if (lowerName.includes('grass')) tags.push('grass', 'nature');
        if (lowerName.includes('snow')) tags.push('snow', 'winter');
        if (lowerName.includes('punch')) tags.push('punch', 'combat');
        if (lowerName.includes('bell')) tags.push('bell');
        if (lowerName.includes('plate')) tags.push('plate');
        if (lowerName.includes('plank')) tags.push('plank', 'wood');
        if (lowerName.includes('tin')) tags.push('tin', 'metal');
        if (lowerName.includes('mining')) tags.push('mining', 'dig');
        if (lowerName.includes('soft')) tags.push('soft');
        if (lowerName.includes('heavy')) tags.push('heavy');
        if (lowerName.includes('light')) tags.push('light');
        if (lowerName.includes('medium')) tags.push('medium');
        if (lowerName.includes('computer')) tags.push('computer', 'digital');
        if (lowerName.includes('forcefield')) tags.push('forcefield');
        if (lowerName.includes('slime')) tags.push('slime', 'liquid');
        if (lowerName.includes('thruster')) tags.push('thruster', 'fire');
        if (lowerName.includes('space')) tags.push('space');
        if (lowerName.includes('retro')) tags.push('retro');
        if (lowerName.includes('large')) tags.push('large');
        if (lowerName.includes('small')) tags.push('small');
        if (lowerName.includes('circular')) tags.push('circular');
        if (lowerName.includes('low')) tags.push('low');
        if (lowerName.includes('back')) tags.push('navigation');
        if (lowerName.includes('close')) tags.push('transition');
        if (lowerName.includes('open')) tags.push('transition');
        if (lowerName.includes('confirmation')) tags.push('confirmation', 'success');
        if (lowerName.includes('error')) tags.push('error', 'notification');
        if (lowerName.includes('drop')) tags.push('drop');
        if (lowerName.includes('glitch')) tags.push('glitch', 'digital');
        if (lowerName.includes('maximize')) tags.push('window');
        if (lowerName.includes('minimize')) tags.push('window');
        if (lowerName.includes('question')) tags.push('question', 'notification');
        if (lowerName.includes('scratch')) tags.push('scratch');
        if (lowerName.includes('scroll')) tags.push('scroll');
        if (lowerName.includes('select')) tags.push('select');
        if (lowerName.includes('toggle')) tags.push('toggle');
        if (lowerName.includes('tick')) tags.push('tick', 'clock');
        if (lowerName.includes('bong')) tags.push('notification');
        if (lowerName.includes('pluck')) tags.push('pluck');
        if (lowerName.includes('belt')) tags.push('belt', 'leather');
        if (lowerName.includes('handle')) tags.push('handle');
        if (lowerName.includes('chop')) tags.push('chop', 'action');
        if (lowerName.includes('creak')) tags.push('creak');
        if (lowerName.includes('draw')) tags.push('draw');
        if (lowerName.includes('slice')) tags.push('slice');
        if (lowerName.includes('latch')) tags.push('latch');
        if (lowerName.includes('pot')) tags.push('pot');
        if (lowerName.includes('powerup')) tags.push('powerup', 'game');
        if (lowerName.includes('zap')) tags.push('zap');
        if (lowerName.includes('trash')) tags.push('trash');
        if (lowerName.includes('war_')) tags.push('war', 'combat');
        if (lowerName.includes('game_over')) tags.push('gameover');
        if (lowerName.includes('you_win')) tags.push('win', 'success');
        if (lowerName.includes('you_lose')) tags.push('lose', 'fail');
        if (lowerName.includes('mission')) tags.push('mission');
        if (lowerName.includes('level')) tags.push('level');
        if (lowerName.includes('round')) tags.push('round');
        if (lowerName.includes('ready')) tags.push('ready');
        if (lowerName.includes('set')) tags.push('set');
        if (lowerName.includes('go')) tags.push('go');
        if (lowerName.includes('correct')) tags.push('correct', 'success');
        if (lowerName.includes('wrong')) tags.push('wrong', 'fail');
        if (lowerName.includes('congratulations')) tags.push('congratulations', 'success');
        if (lowerName.includes('hurry')) tags.push('hurry', 'time');
        if (lowerName.includes('tie')) tags.push('tie');
        if (lowerName.includes('highscore')) tags.push('highscore', 'score');
        if (lowerName.includes('objective')) tags.push('objective');
        if (lowerName.includes('medic')) tags.push('medic');
        if (lowerName.includes('sniper')) tags.push('sniper', 'weapon');
        if (lowerName.includes('reloading')) tags.push('reloading');
        if (lowerName.includes('backup')) tags.push('backup');
        if (lowerName.includes('cover')) tags.push('cover');
        if (lowerName.includes('fire')) tags.push('fire');
        if (lowerName.includes('target')) tags.push('target');
        
        // Remove duplicates
        const uniqueTags = [...new Set(tags)];
        
        const displayName = subcategory ? `${name} (${subcategory})` : name;
        
        manifest.push({
            id: id++,
            path: filePath,
            name: displayName,
            category: categoryName,
            format: ext,
            size: stats.size,
            duration: 0,
            rating: 0,
            tags: uniqueTags,
            description: displayName + ' from Kenney ' + categoryName + ' collection.',
            library: 'Kenney',
            dateAdded: new Date().toISOString()
        });
    });
}

// Get all subdirectories in Kenney folder
const subdirs = fs.readdirSync(kenneyBase, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

console.log('Found subdirs:', subdirs);

// Process each subdirectory
subdirs.forEach(subdir => {
    // Get category name from folder name (remove 'kenney_' prefix and format)
    let categoryName = subdir.replace('kenney_', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Override category for voiceover packs to 'Voices'
    const isVoiceover = subdir.toLowerCase().includes('voiceover');
    if (isVoiceover) {
        categoryName = 'Voices';
    }
    
    // Check for standard Audio folder
    const audioPath = path.join(kenneyBase, subdir, 'Audio');
    if (fs.existsSync(audioPath)) {
        console.log('Processing Audio folder in:', subdir);
        processAudioDirectory(audioPath, categoryName);
    }
    
    // Check for voiceover-style folders (Male/Female directly in the folder)
    const malePath = path.join(kenneyBase, subdir, 'Male');
    const femalePath = path.join(kenneyBase, subdir, 'Female');
    
    if (fs.existsSync(malePath)) {
        console.log('Processing Male voiceover folder in:', subdir);
        processAudioDirectory(malePath, categoryName, 'Male');
    }
    if (fs.existsSync(femalePath)) {
        console.log('Processing Female voiceover folder in:', subdir);
        processAudioDirectory(femalePath, categoryName, 'Female');
    }
    
    if (!fs.existsSync(audioPath) && !fs.existsSync(malePath) && !fs.existsSync(femalePath)) {
        console.log('No Audio/Male/Female folder in:', subdir);
    }
});

// Write manifest
const outputPath = path.join(kenneyBase, 'manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log('Generated manifest with', manifest.length, 'entries at', outputPath);
