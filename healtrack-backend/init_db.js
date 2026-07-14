require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDB() {
    const dbConfig = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '12345678',
    };

    let connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL. Ensuring database exists...');

    try {
        await connection.query('CREATE DATABASE IF NOT EXISTS team_project');
        await connection.end();

        // Reconnect specifying the database name
        connection = await mysql.createConnection({
            ...dbConfig,
            database: 'team_project'
        });
        console.log('Connected to team_project database. Importing schema...');

        const sqlPath = path.join(__dirname, '..', 'team_project.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        const statements = sql
            .replace(/\r\n/g, '\n')
            .split(/;\s*$/m)
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        for (let i = 0; i < statements.length; i++) {
            let stmt = statements[i];
            // Remove line comments
            stmt = stmt.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim();
            if (stmt && !stmt.toLowerCase().startsWith('create database') && !stmt.toLowerCase().startsWith('use ')) {
                console.log(`Executing statement ${i + 1}/${statements.length}: ${stmt.substring(0, 80).replace(/\n/g, ' ')}...`);
                await connection.query(stmt);
            }
        }
        console.log('✅ Schema imported successfully!');
    } catch (err) {
        console.error('❌ Error importing schema:', err);
    } finally {
        await connection.end();
        process.exit();
    }
}

initDB();
