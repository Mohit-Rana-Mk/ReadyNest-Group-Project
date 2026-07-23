const db = require('../config/db');

// Initialize platform_feedback table in MySQL
const initFeedbackTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS platform_feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                user_name VARCHAR(255) NULL,
                user_email VARCHAR(255) NULL,
                rating INT NOT NULL DEFAULT 5,
                category VARCHAR(255) NOT NULL DEFAULT 'General Experience',
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (err) {
        console.error("Error initializing platform_feedback table:", err);
    }
};

// Initialize table on module load
initFeedbackTable();

exports.submitFeedback = async (req, res) => {
    try {
        await initFeedbackTable();
        const { rating, category, message, name, email } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Feedback message is required.' });
        }

        const userId = req.user?.id || req.user?.user_id || null;
        const userName = name?.trim() || req.user?.name || req.user?.full_name || 'Anonymous User';
        const userEmail = email?.trim() || req.user?.email || null;
        const finalRating = Math.min(Math.max(parseInt(rating) || 5, 1), 5);
        const finalCategory = category || 'General Experience';

        const [result] = await db.query(
            `INSERT INTO platform_feedback 
                (user_id, user_name, user_email, rating, category, message) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, userName, userEmail, finalRating, finalCategory, message.trim()]
        );

        res.status(201).json({
            success: true,
            message: 'Thank you! Your feedback has been submitted successfully.',
            feedbackId: result.insertId
        });
    } catch (err) {
        console.error("Error submitting feedback:", err);
        res.status(500).json({ success: false, message: 'Failed to submit feedback. Please try again.', error: err.message });
    }
};

exports.getFeedbackList = async (req, res) => {
    try {
        await initFeedbackTable();
        const [feedbackList] = await db.query(`SELECT * FROM platform_feedback ORDER BY created_at DESC LIMIT 50`);
        const [stats] = await db.query(`SELECT COUNT(*) as total, AVG(rating) as avgRating FROM platform_feedback`);
        
        const total = stats[0]?.total || 0;
        const rawAvg = stats[0]?.avgRating;
        let avgRating = 5.0;
        if (total > 0 && rawAvg !== null && rawAvg !== undefined) {
            avgRating = parseFloat(Number(rawAvg).toFixed(1));
        }

        res.json({
            success: true,
            data: feedbackList,
            metrics: {
                total,
                avgRating
            }
        });
    } catch (err) {
        console.error("Error fetching feedback list:", err);
        res.status(500).json({ success: false, message: 'Failed to load feedback list.', error: err.message });
    }
};
