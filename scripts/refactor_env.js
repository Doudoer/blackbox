const fs = require('fs');
const path = require('path');

const apiDir = path.join(process.cwd(), 'app', 'api');

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            refactorFile(fullPath);
        }
    });
}

function refactorFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('AUTH_SECRET') && !content.includes("from '../../../lib/env'") && !content.includes("from '../../../../lib/env'") && !content.includes("from '../../../../../lib/env'")) {
        console.log(`Refactoring ${filePath}...`);

        // Determine relative path for import
        const relativeApi = path.relative(path.dirname(filePath), path.join(process.cwd(), 'lib/env'));
        const importPath = relativeApi.replace(/\\/g, '/').replace('.ts', '').replace('.js', '');
        const finalImportPath = importPath.startsWith('.') ? importPath : './' + importPath;

        // Add import
        if (!content.includes('getAuthSecret')) {
            const importLine = `import { getAuthSecret } from '${finalImportPath}'\n`;
            // Add after the last import
            const lastImportIndex = content.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                const endOfLineIndex = content.indexOf('\n', lastImportIndex);
                content = content.slice(0, endOfLineIndex + 1) + importLine + content.slice(endOfLineIndex + 1);
            } else {
                content = importLine + content;
            }
        }

        // Replace usage pattern 1: const secret = process.env.AUTH_SECRET || ... || 'dev-secret'
        content = content.replace(/const\s+secret\s*=\s*process\.env\.AUTH_SECRET\s*\|\|\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY\s*\|\|\s*'dev-secret'/g, 'const secret = getAuthSecret()');

        // Replace usage pattern 2: process.env.AUTH_SECRET!
        content = content.replace(/process\.env\.AUTH_SECRET!/g, 'getAuthSecret()');

        // Replace any remaining process.env.AUTH_SECRET
        content = content.replace(/process\.env\.AUTH_SECRET/g, 'getAuthSecret()');

        fs.writeFileSync(filePath, content);
    }
}

walk(apiDir);
console.log('Refactoring complete.');
