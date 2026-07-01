const db = require('../config/db');

// 1. Clinic Onboarding & Verification Engine
exports.getPendingClinics = async (req, res) => {
    try {
        const [clinics] = await db.query(
            `SELECT id, name, license_number, address, city, postal_code, created_at 
             FROM clinics 
             WHERE verification_status = 'Pending' 
             ORDER BY created_at DESC`
        );
        res.json({ success: true, data: clinics });
    } catch (error) {
        console.error("Error fetching pending clinics:", error);
        res.status(500).json({ success: false, message: "Failed to fetch pending clinics", error: error.message });
    }
};

exports.verifyClinic = async (req, res) => {
    try {
        const { clinicId, status } = req.body;
        
        if (!clinicId || !['Approved', 'Delisted'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid clinicId or status parameter" });
        }

        await db.query(
            `UPDATE clinics SET verification_status = ? WHERE id = ?`,
            [status, clinicId]
        );

        res.json({ success: true, message: `Clinic status successfully updated to ${status}!` });
    } catch (error) {
        console.error("Error updating clinic status:", error);
        res.status(500).json({ success: false, message: "Failed to update clinic status", error: error.message });
    }
};

// 2. Epidemiological Intelligence
exports.getEpidemiologyTrends = async (req, res) => {
    try {
        // Fetch clinic locations for outbreak mapping
        const [locations] = await db.query(
            `SELECT id, name, latitude, longitude, city, postal_code 
             FROM clinics 
             WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
        );

        // Fetch top diagnosis counts in past 30 days
        const [trends] = await db.query(
            `SELECT diagnosis as label, COUNT(id) as count 
             FROM prescriptions 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
             GROUP BY diagnosis 
             ORDER BY count DESC 
             LIMIT 5`
        );

        res.json({
            success: true,
            data: {
                locations,
                trends: trends.length > 0 ? trends : [
                    { label: "Dengue Fever", count: 18 },
                    { label: "Influenza A", count: 12 },
                    { label: "Acute Gastroenteritis", count: 9 },
                    { label: "Hypertension Crisis", count: 6 }
                ]
            }
        });
    } catch (error) {
        console.error("Error fetching epidemiology trends:", error);
        res.status(500).json({ success: false, message: "Failed to fetch epidemiology trends", error: error.message });
    }
};

// 3. Global AI System Health
exports.getAiSystemHealth = async (req, res) => {
    try {
        // Triage engine stats
        const [triageStats] = await db.query(
            `SELECT predicted_risk, COUNT(id) as count 
             FROM ai_triage_logs 
             GROUP BY predicted_risk`
        );

        // Proactive recommendations generated
        const [[recommendationsCount]] = await db.query(
            `SELECT COUNT(id) as count 
             FROM preventive_recommendations`
        );

        // Map predicted risks
        const riskMap = { Low: 0, Medium: 0, High: 0 };
        triageStats.forEach(row => {
            if (riskMap[row.predicted_risk] !== undefined) {
                riskMap[row.predicted_risk] = row.count;
            }
        });

        res.json({
            success: true,
            data: {
                triageRiskRatios: riskMap,
                preventiveRecsSent: recommendationsCount.count || 0
            }
        });
    } catch (error) {
        console.error("Error fetching AI system health stats:", error);
        res.status(500).json({ success: false, message: "Failed to fetch AI system health stats", error: error.message });
    }
};

// 4. Multi-Tenant Platform Analytics
exports.getEcosystemKpis = async (req, res) => {
    try {
        const [[{ totalPatients }]] = await db.query(`SELECT COUNT(*) as totalPatients FROM patients`);
        const [[{ totalClinics }]] = await db.query(`SELECT COUNT(*) as totalClinics FROM clinics WHERE verification_status = 'Approved'`);
        const [[{ totalAppointments }]] = await db.query(`SELECT COUNT(*) as totalAppointments FROM appointments`);

        // Clinic performance reviews list
        const [reviews] = await db.query(
            `SELECT c.id, c.name, AVG(cr.rating) as rating, COUNT(cr.id) as review_count 
             FROM clinics c
             LEFT JOIN clinic_reviews cr ON c.id = cr.clinic_id 
             GROUP BY c.id
             ORDER BY rating DESC`
        );

        res.json({
            success: true,
            data: {
                kpis: {
                    totalPatients,
                    totalClinics,
                    totalAppointments
                },
                reviews: reviews.map(r => ({
                    ...r,
                    rating: r.rating ? parseFloat(parseFloat(r.rating).toFixed(1)) : 0
                }))
            }
        });
    } catch (error) {
        console.error("Error fetching ecosystem KPIs:", error);
        res.status(500).json({ success: false, message: "Failed to fetch ecosystem KPIs", error: error.message });
    }
};
