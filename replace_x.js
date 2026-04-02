const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
let changed = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('×')) {
        let newContent = content.replace(/(>)\s*×\s*(<\/button>)/g, '$1<i className="fa fa-times" />$2');
        // also catch cases where it might just be > × <
        newContent = newContent.replace(/(>)\s*×\s*(<)/g, '$1<i className="fa fa-times" />$2');
        
        if (newContent !== content) {
            fs.writeFileSync(file, newContent, 'utf8');
            changed++;
            console.log('Updated ' + file);
        }
    }
});
console.log('Changed files: ' + changed);
