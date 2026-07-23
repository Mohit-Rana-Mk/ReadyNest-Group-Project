const db = require('../config/db');

// Initialize support_tickets table in MySQL
const initSupportTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS support_tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                user_name VARCHAR(255) NULL,
                user_email VARCHAR(255) NULL,
                user_role VARCHAR(100) NULL,
                portal_used VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                category VARCHAR(255) NOT NULL,
                priority VARCHAR(50) DEFAULT 'Medium',
                description TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'Open',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (err) {
        console.error("Error initializing support_tickets table:", err);
    }
};

// Initialize table on module load
initSupportTable();

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

        const [result] = await db.query(
            `INSERT INTO support_tickets 
                (user_id, user_name, user_email, user_role, portal_used, subject, category, priority, description, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')`,
            [userId, userName, userEmail, userRole, finalPortal, subject.trim(), category, priority || 'Medium', description.trim()]
        );

        res.status(201).json({
            success: true,
            message: 'Support ticket raised successfully!',
            ticketId: result.insertId
        });
    } catch (err) {
        console.error("Error creating support ticket:", err);
        res.status(500).json({ success: false, message: 'Failed to raise support ticket.' });
    }
};

exports.getAllTickets = async (req, res) => {
    try {
        const [tickets] = await db.query(`SELECT * FROM support_tickets ORDER BY created_at DESC`);
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

        const [result] = await db.query(`UPDATE support_tickets SET status = ? WHERE id = ?`, [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found.' });
        }

        res.json({ success: true, message: `Ticket status updated to ${status}.` });
    } catch (err) {
        console.error("Error updating ticket status:", err);
        res.status(500).json({ success: false, message: 'Failed to update ticket status.' });
    }
};
