const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(fullPath));
        } else {
            if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('alert(')) {
        let newContent = content.replace(/alert\(([\s\S]*?)\)/g, (match, p1) => {
            let lower = p1.toLowerCase();
            if (lower.includes('fail') || lower.includes('error') || lower.includes('denied') || lower.includes('unable') || lower.includes('cannot')) {
                return `toast.error(${p1})`;
            } else if (lower.includes('success')) {
                return `toast.success(${p1})`;
            }
            return `toast.info(${p1})`;
        });
        
        if (!newContent.includes('import { toast }')) {
            // Calculate relative path to src/components/ui/Toast
            // file is like src/portals/admin/AdminDashboard.jsx
            const parts = file.split(path.sep);
            const depth = parts.length - 2; // src is depth 0
            
            let relativePath = '';
            if (depth === 0) relativePath = './components/ui/Toast';
            else if (depth === 1) relativePath = '../components/ui/Toast';
            else if (depth === 2) relativePath = '../../components/ui/Toast';
            else if (depth === 3) relativePath = '../../../components/ui/Toast';
            else if (depth === 4) relativePath = '../../../../components/ui/Toast';
            
            // Insert at the top of the file
            newContent = `import { toast } from '${relativePath}';\n` + newContent;
        }

        fs.writeFileSync(file, newContent);
        console.log('Updated', file);
    }
});
