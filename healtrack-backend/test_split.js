const fs = require('fs');
const path = require('path');
const sqlPath = path.join(__dirname, '..', 'team_project.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');
const statements = sql
    .replace(/\r\n/g, '\n')
    .split(/;\s*$/m)
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

console.log("STMT 19 full content:");
console.log(statements[18]);
