const fs = require('fs');
const path = require('path');

const h360sBase = path.join(__dirname, '..', 'audio', 'H360s');
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
            // Recursively process subdirectories, passing subcategory
            const subcat = subcategory || item.name;
            processAudioDirectory(path.join(dirPath, item.name), categoryName, subcat);
            return;
        }
        
        const file = item.name;
        const ext = path.extname(file).toLowerCase().slice(1);
        if (!['ogg', 'wav', 'mp3'].includes(ext)) return;
        
        const relativePath = path.relative(h360sBase, path.join(dirPath, file));
        const filePath = path.join('audio', 'H360s', relativePath);
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
        if (lowerName.includes('step') || lowerName.includes('foot')) tags.push('footsteps', 'walk');
        if (lowerName.includes('run')) tags.push('run', 'movement');
        if (lowerName.includes('jump')) tags.push('jump', 'movement');
        if (lowerName.includes('land')) tags.push('land', 'impact');
        if (lowerName.includes('concrete')) tags.push('concrete', 'surface');
        if (lowerName.includes('metal')) tags.push('metal', 'surface');
        if (lowerName.includes('wood')) tags.push('wood', 'surface');
        if (lowerName.includes('grass')) tags.push('grass', 'nature');
        if (lowerName.includes('dirt')) tags.push('dirt', 'ground');
        if (lowerName.includes('gravel')) tags.push('gravel', 'surface');
        if (lowerName.includes('water')) tags.push('water', 'liquid');
        if (lowerName.includes('mud')) tags.push('mud', 'ground');
        if (lowerName.includes('tile')) tags.push('tile', 'surface');
        if (lowerName.includes('glass')) tags.push('glass', 'surface');
        if (lowerName.includes('steel')) tags.push('steel', 'metal');
        if (lowerName.includes('panel')) tags.push('panel', 'surface');
        if (lowerName.includes('grate')) tags.push('grate', 'metal');
        
        if (lowerName.includes('drop')) tags.push('drop', 'liquid');
        if (lowerName.includes('drip')) tags.push('drip', 'liquid');
        if (lowerName.includes('splash')) tags.push('splash', 'water');
        
        if (lowerName.includes('cloth')) tags.push('cloth', 'fabric');
        if (lowerName.includes('woosh')) tags.push('woosh', 'fabric', 'movement');
        if (lowerName.includes('smoke')) tags.push('smoke', 'effect');
        
        if (lowerName.includes('card')) tags.push('card', 'paper');
        if (lowerName.includes('flip')) tags.push('flip', 'paper');
        if (lowerName.includes('page')) tags.push('page', 'paper');
        
        if (lowerName.includes('weapon')) tags.push('weapon', 'combat');
        if (lowerName.includes('grab')) tags.push('grab', 'weapon');
        if (lowerName.includes('punch')) tags.push('punch', 'combat', 'impact');
        if (lowerName.includes('hit')) tags.push('hit', 'impact', 'combat');
        if (lowerName.includes('swing')) tags.push('swing', 'weapon');
        if (lowerName.includes('block')) tags.push('block', 'combat');
        
        if (lowerName.includes('ambience') || lowerName.includes('ambient')) tags.push('ambience', 'background');
        if (lowerName.includes('nature')) tags.push('nature', 'outdoor');
        if (lowerName.includes('city')) tags.push('city', 'urban');
        if (lowerName.includes('room')) tags.push('room', 'indoor');
        if (lowerName.includes('forest')) tags.push('forest', 'nature');
        if (lowerName.includes('wind')) tags.push('wind', 'weather');
        if (lowerName.includes('rain')) tags.push('rain', 'weather', 'water');
        if (lowerName.includes('thunder')) tags.push('thunder', 'weather');
        if (lowerName.includes('fire')) tags.push('fire', 'effect');
        
        if (lowerName.includes('voice') || lowerName.includes('vocal')) tags.push('voice', 'human');
        if (lowerName.includes('speak')) tags.push('speak', 'voice');
        if (lowerName.includes('breath')) tags.push('breath', 'human');
        if (lowerName.includes('grunt')) tags.push('grunt', 'voice', 'effort');
        if (lowerName.includes('gasp')) tags.push('gasp', 'voice');
        if (lowerName.includes('scream')) tags.push('scream', 'voice');
        if (lowerName.includes('laugh')) tags.push('laugh', 'voice');
        
        if (lowerName.includes('explosion')) tags.push('explosion', 'combat', 'impact');
        if (lowerName.includes('gun') || lowerName.includes('shot')) tags.push('gun', 'weapon', 'combat');
        if (lowerName.includes('magic')) tags.push('magic', 'effect');
        if (lowerName.includes('spell')) tags.push('spell', 'magic');
        if (lowerName.includes('power')) tags.push('power', 'effect');
        if (lowerName.includes('charge')) tags.push('charge', 'effect');
        if (lowerName.includes('laser')) tags.push('laser', 'scifi', 'weapon');
        if (lowerName.includes('electric')) tags.push('electric', 'effect');
        
        if (lowerName.includes('door')) tags.push('door', 'transition');
        if (lowerName.includes('gate')) tags.push('gate', 'transition');
        if (lowerName.includes('button')) tags.push('button', 'ui');
        if (lowerName.includes('click')) tags.push('click', 'ui');
        if (lowerName.includes('switch')) tags.push('switch', 'mechanical');
        if (lowerName.includes('lever')) tags.push('lever', 'mechanical');
        
        if (lowerName.includes('engine')) tags.push('engine', 'machine');
        if (lowerName.includes('motor')) tags.push('motor', 'machine');
        if (lowerName.includes('fan')) tags.push('fan', 'machine');
        if (lowerName.includes('machine')) tags.push('machine', 'mechanical');
        
        if (lowerName.includes('alarm')) tags.push('alarm', 'warning');
        if (lowerName.includes('siren')) tags.push('siren', 'warning');
        if (lowerName.includes('bell')) tags.push('bell', 'signal');
        
        if (lowerName.includes('absolver')) tags.push('absolver', 'game');
        if (lowerName.includes('brawlhalla')) tags.push('brawlhalla', 'game');
        if (lowerName.includes('injustice')) tags.push('injustice', 'game');
        if (lowerName.includes('fatal')) tags.push('fatalfake', 'game');
        
        if (lowerName.includes('ui') || lowerName.includes('menu')) tags.push('ui', 'interface');
        if (lowerName.includes('notification')) tags.push('notification', 'ui');
        if (lowerName.includes('select')) tags.push('select', 'ui');
        if (lowerName.includes('confirm')) tags.push('confirm', 'ui');
        if (lowerName.includes('cancel')) tags.push('cancel', 'ui');
        
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
            description: name + ' from H360s ' + categoryName + ' collection.',
            library: 'H360s',
            dateAdded: new Date().toISOString()
        });
    });
}

// Define the main categories (top-level folders)
const categories = ['Ambience', 'Combat', 'Foley', 'Misc', 'Voices'];

console.log('Scanning H360s audio library...');

// Process each category
categories.forEach(category => {
    const categoryPath = path.join(h360sBase, category);
    if (fs.existsSync(categoryPath)) {
        console.log('Processing category:', category);
        processAudioDirectory(categoryPath, category);
    }
});

// Write manifest
const outputPath = path.join(h360sBase, 'manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log('Generated manifest with', manifest.length, 'entries at', outputPath);