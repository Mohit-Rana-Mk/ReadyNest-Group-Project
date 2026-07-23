const { getDb } = require('../db/sqlite');

// Initialize support_tickets table in SQLite
const initSupportTable = async () => {
    const db = await getDb();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS support_tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_name TEXT,
            user_email TEXT,
            user_role TEXT,
            portal_used TEXT NOT NULL,
            subject TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT DEFAULT 'Medium',
            description TEXT NOT NULL,
            status TEXT DEFAULT 'Open',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
};

// Ensure table is created on module load
initSupportTable().catch(err => console.error("Error initializing support_tickets table:", err));

exports.createTicket = async (req, res) => {
    try {
        const { subject, category, priority, description, portalUsed } = req.body;

        if (!subject || !category || !description) {
            return res.status(400).json({ success: false, message: 'Subject, category, and description are required.' });
        }

        const userId = req.user?.id || req.user?.user_id || null;
        const userName = req.user?.name || req.user?.full_name || 'Anonymous User';
        const userEmail = req.user?.email || null;
        const userRole = req.user?.role || 'User';
        const finalPortal = portalUsed || 'Portal Workstation';

        const db = await getDb();
        const result = await db.run(
            `INSERT INTO support_tickets 
                (user_id, user_name, user_email, user_role, portal_used, subject, category, priority, description, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')`,
            [userId, userName, userEmail, userRole, finalPortal, subject.trim(), category, priority || 'Medium', description.trim()]
        );

        res.status(201).json({
            success: true,
            message: 'Support ticket raised successfully!',
            ticketId: result.lastID
        });
    } catch (err) {
        console.error("Error creating support ticket:", err);
        res.status(500).json({ success: false, message: 'Failed to raise support ticket.' });
    }
};

exports.getAllTickets = async (req, res) => {
    try {
        const db = await getDb();
        const tickets = await db.all(`SELECT * FROM support_tickets ORDER BY created_at DESC`);
        res.json({ success: true, data: tickets });
    } catch (err) {
        console.error("Error fetching support tickets:", err);
        res.status(500).json({ success: false, message: 'Failed to load support tickets.' });
    }
};

exports.updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid ticket status.' });
        }

        const db = await getDb();
        const result = await db.run(`UPDATE support_tickets SET status = ? WHERE id = ?`, [status, id]);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found.' });
        }

        res.json({ success: true, message: `Ticket status updated to ${status}.` });
    } catch (err) {
        console.error("Error updating ticket status:", err);
        res.status(500).json({ success: false, message: 'Failed to update ticket status.' });
    }
};
