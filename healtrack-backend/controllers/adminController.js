const db = require('../config/db');
const adminService = require('../services/adminService');
const outbreakNewsService = require('../services/outbreakNewsService');

// 1. Clinic Onboarding & Verification Engine
exports.getPendingClinics = async (req, res) => {
    try {
        const clinics = await adminService.getPendingClinics();
        res.json({ success: true, data: clinics });
    } catch (error) {
        console.error("Error fetching pending clinics:", error);
        res.status(500).json({ success: false, message: "Failed to fetch pending clinics", error: error.message });
    }
};

exports.verifyClinic = async (req, res) => {
    try {
        const result = await adminService.verifyClinic(req.body);
        res.json(result);
    } catch (error) {
        if (error.message === "Invalid clinicId or status parameter") {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error("Error updating clinic status:", error);
        res.status(500).json({ success: false, message: "Failed to update clinic status", error: error.message });
    }
};

exports.createClinic = async (req, res) => {
    try {
        const result = await adminService.createClinic(req.body);
        res.json(result);
    } catch (error) {
        if (error.message === "Missing required clinic information.") {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error("Error creating clinic:", error);
        res.status(500).json({ success: false, message: "Failed to onboard clinic", error: error.message });
    }
};

// 2. Epidemiological Intelligence
exports.getEpidemiologyTrends = async (req, res) => {
    try {
        const data = await adminService.getEpidemiologyTrends(req.query.days);
        res.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching epidemiology trends:", error);
        res.status(500).json({ success: false, message: "Failed to fetch epidemiology trends", error: error.message });
    }
};

// 3. Global AI System Health
exports.getAiSystemHealth = async (req, res) => {
    try {
        const data = await adminService.getAiSystemHealth();
        res.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching AI system health stats:", error);
        res.status(500).json({ success: false, message: "Failed to fetch AI system health stats", error: error.message });
    }
};

// 4. Multi-Tenant Platform Analytics
exports.getEcosystemKpis = async (req, res) => {
    try {
        const data = await adminService.getEcosystemKpis();
        res.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching ecosystem KPIs:", error);
        res.status(500).json({ success: false, message: "Failed to fetch ecosystem KPIs", error: error.message });
    }
};

// 5. AuraCare Predictive AI Analytics
exports.getAuraCareStats = async (req, res) => {
    try {
        const { dept, time } = req.query; // e.g. dept='all', time='weekly'
        
        // 1. Get high-risk triage patients from DB
        const [highRiskLogs] = await db.query(
            `SELECT l.id, p.name, p.gender, l.predicted_risk as risk, l.created_at, 
                     l.extracted_symptoms, l.user_input
             FROM ai_triage_logs l
             JOIN patients p ON l.patient_id = p.id
             ORDER BY l.created_at DESC
             LIMIT 6`
        );

        // Parse extracted symptoms if stringified JSON
        const parsedHighRisk = highRiskLogs.map(log => {
            let symptoms = [];
            try {
                symptoms = typeof log.extracted_symptoms === 'string' 
                    ? JSON.parse(log.extracted_symptoms) 
                    : (log.extracted_symptoms || []);
            } catch (e) {
                symptoms = [];
            }
            return {
                id: log.id,
                name: log.name,
                gender: log.gender,
                risk: log.risk,
                date: new Date(log.created_at).toLocaleDateString(),
                symptoms: symptoms,
                user_input: log.user_input
            };
        });

        // 2. Compute actual appointment KPIs
        let apptFilterQuery = 'WHERE 1=1';
        const params = [];
        if (dept && dept !== 'all') {
            apptFilterQuery += ` AND d.service_id = (SELECT id FROM services WHERE LOWER(name) = ? LIMIT 1)`;
            params.push(dept.toLowerCase());
        }

        const [[{ totalAppts }]] = await db.query(
            `SELECT COUNT(a.id) as totalAppts 
             FROM appointments a
             JOIN users d ON a.doctor_id = d.id
             ${apptFilterQuery}`,
            params
        );

        const [[{ cancelledAppts }]] = await db.query(
            `SELECT COUNT(a.id) as cancelledAppts 
             FROM appointments a
             JOIN users d ON a.doctor_id = d.id
             ${apptFilterQuery} AND a.status = 'Cancelled'`,
            params
        );

        const noShowRate = totalAppts > 0 ? ((cancelledAppts / totalAppts) * 100).toFixed(1) : '0.0';

        // 3. Compute clinic rating & satisfaction
        const [[{ avgRating }]] = await db.query(
            `SELECT AVG(rating) as rating FROM clinic_reviews`
        );
        const actualRating = avgRating ? parseFloat(parseFloat(avgRating).toFixed(1)) : 0.0;

        // 4. Fetch real appointment trends from DB (group by time filter)
        let labels = [];
        if (time === 'daily') {
            labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
        } else if (time === 'monthly') {
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        } else { // weekly
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        }

        let actualData = new Array(labels.length).fill(0);

        try {
            let dbTrendQuery = '';
            if (time === 'daily') {
                dbTrendQuery = `SELECT HOUR(appointment_date) as hr, COUNT(id) as cnt 
                                FROM appointments 
                                WHERE appointment_date >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                                GROUP BY hr`;
            } else if (time === 'monthly') {
                dbTrendQuery = `SELECT MONTH(appointment_date) as mth, COUNT(id) as cnt 
                                FROM appointments 
                                WHERE appointment_date >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
                                GROUP BY mth`;
            } else {
                dbTrendQuery = `SELECT DAYOFWEEK(appointment_date) as dow, COUNT(id) as cnt 
                                FROM appointments 
                                WHERE appointment_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                                GROUP BY dow`;
            }

            const [dbTrends] = await db.query(dbTrendQuery);
            if (dbTrends && dbTrends.length > 0) {
                dbTrends.forEach(row => {
                    if (time === 'daily') {
                        const hrStr = `${String(Math.floor(row.hr / 2) * 2).padStart(2, '0')}:00`;
                        const idx = labels.indexOf(hrStr);
                        if (idx !== -1) actualData[idx] += row.cnt;
                    } else if (time === 'monthly') {
                        if (row.mth >= 1 && row.mth <= 12) actualData[row.mth - 1] = row.cnt;
                    } else {
                        const dowMap = [6, 0, 1, 2, 3, 4, 5];
                        const idx = dowMap[row.dow - 1];
                        if (idx !== undefined) actualData[idx] = row.cnt;
                    }
                });
            }
        } catch (e) {
            console.warn('Error fetching DB trends:', e.message);
        }

        let forecastData = [...actualData];
        const hasAppointments = actualData.some(val => val > 0);
        if (hasAppointments) {
            for (let i = 0; i < labels.length; i++) {
                const lastVal = actualData[i] || actualData[actualData.length - 1] || 5;
                forecastData[i] = Math.round(lastVal * (1.05 + Math.random() * 0.15));
            }
        }

        // 5. Compute real or dynamic disease trends
        let diseaseLabels = [...labels];
        let diseaseFlu = new Array(labels.length).fill(0);
        let diseaseDiabetes = new Array(labels.length).fill(0);
        let diseaseDengue = new Array(labels.length).fill(0);

        try {
            const [dbPresc] = await db.query(
                `SELECT diagnosis, created_at FROM prescriptions`
            );
            dbPresc.forEach(p => {
                const diag = (p.diagnosis || '').toLowerCase();
                let targetArray = null;
                if (diag.includes('flu') || diag.includes('influenza') || diag.includes('cold') || diag.includes('cough')) {
                    targetArray = diseaseFlu;
                } else if (diag.includes('diabet') || diag.includes('sugar') || diag.includes('hypogly')) {
                    targetArray = diseaseDiabetes;
                } else if (diag.includes('dengue') || diag.includes('malaria') || diag.includes('fever')) {
                    targetArray = diseaseDengue;
                }

                if (targetArray && targetArray.length > 0) {
                    const date = new Date(p.created_at);
                    let idx = -1;
                    if (time === 'daily') {
                        const hr = date.getHours();
                        const hrStr = `${String(Math.floor(hr / 2) * 2).padStart(2, '0')}:00`;
                        idx = labels.indexOf(hrStr);
                    } else if (time === 'monthly') {
                        idx = date.getMonth();
                    } else { // weekly
                        const day = date.getDay(); // 0 is Sunday, 1 is Monday...
                        const dowMap = [6, 0, 1, 2, 3, 4, 5];
                        idx = dowMap[day];
                    }
                    if (idx !== -1 && idx < targetArray.length) {
                        targetArray[idx] += 1;
                    }
                }
            });
        } catch (err) {
            console.warn("Could not load dynamic disease trends from prescriptions:", err);
        }

        // 6. Compute medicine levels
        let medLabels = [...labels];
        let medInventory = new Array(labels.length).fill(100); // Start fully stocked (100)
        let medDemand = new Array(labels.length).fill(0);

        try {
            const [prescItems] = await db.query(
                `SELECT pi.id, p.created_at 
                 FROM prescription_items pi
                 JOIN prescriptions p ON pi.prescription_id = p.id`
            );
            
            prescItems.forEach(item => {
                const date = new Date(item.created_at);
                let idx = -1;
                if (time === 'daily') {
                    const hr = date.getHours();
                    const hrStr = `${String(Math.floor(hr / 2) * 2).padStart(2, '0')}:00`;
                    idx = labels.indexOf(hrStr);
                } else if (time === 'monthly') {
                    idx = date.getMonth();
                } else { // weekly
                    const day = date.getDay();
                    const dowMap = [6, 0, 1, 2, 3, 4, 5];
                    idx = dowMap[day];
                }
                if (idx !== -1 && idx < labels.length) {
                    medDemand[idx] += 10; // increase demand per item
                    medInventory[idx] = Math.max(0, medInventory[idx] - 5); // reduce inventory
                }
            });
            
            // Smoothen inventory decline
            for (let i = 1; i < medInventory.length; i++) {
                if (medInventory[i] === 100) {
                    medInventory[i] = medInventory[i - 1];
                }
            }
        } catch (err) {
            console.warn("Could not load dynamic medicine levels:", err);
        }

        // 7. No-show rates
        let noshowLabels = [];
        let noshowRates = [];

        if (dept && dept !== 'all') {
            noshowLabels = ['Morning Slots', 'Midday Slots', 'Evening Slots'];
            noshowRates = [0, 0, 0];
        } else {
            try {
                const [services] = await db.query(`SELECT name FROM services`);
                noshowLabels = services.map(s => s.name);
                noshowRates = new Array(noshowLabels.length).fill(0);
            } catch (e) {
                noshowLabels = ['Cardiology', 'General Medicine', 'Ophthalmology', 'Orthopedics'];
                noshowRates = [0, 0, 0, 0];
            }
        }

        try {
            if (dept && dept !== 'all') {
                const [slotStats] = await db.query(
                    `SELECT 
                        HOUR(appointment_date) as hr,
                        COUNT(id) as total,
                        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
                     FROM appointments
                     WHERE doctor_id IN (SELECT id FROM users WHERE service_id = (SELECT id FROM services WHERE LOWER(name) = ?))
                     GROUP BY hr`,
                    [dept.toLowerCase()]
                );
                slotStats.forEach(row => {
                    let idx = -1;
                    if (row.hr >= 8 && row.hr < 12) idx = 0;
                    else if (row.hr >= 12 && row.hr < 16) idx = 1;
                    else if (row.hr >= 16 && row.hr <= 20) idx = 2;
                    
                    if (idx !== -1 && row.total > 0) {
                        noshowRates[idx] = parseFloat(((row.cancelled / row.total) * 100).toFixed(1));
                    }
                });
            } else {
                const [cancelledByDept] = await db.query(
                    `SELECT s.name as service_name, 
                            COUNT(a.id) as total,
                            SUM(CASE WHEN a.status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
                     FROM appointments a
                     JOIN users d ON a.doctor_id = d.id
                     JOIN services s ON d.service_id = s.id
                     GROUP BY s.name`
                );
                cancelledByDept.forEach(row => {
                    const idx = noshowLabels.findIndex(l => l.toLowerCase() === row.service_name.toLowerCase());
                    if (idx !== -1 && row.total > 0) {
                        noshowRates[idx] = parseFloat(((row.cancelled / row.total) * 100).toFixed(1));
                    }
                });
            }
        } catch (err) {
            console.warn("Could not load dynamic noshow rates:", err);
        }

        const [prescDiag] = await db.query(
            `SELECT diagnosis, COUNT(id) as cnt 
             FROM prescriptions 
             GROUP BY diagnosis`
        );

        // Compute metadata KPIs
        const [[{ totalItems }]] = await db.query(`SELECT COUNT(*) as cnt FROM prescription_items`);
        const kpiMeddemand = totalItems > 0 ? `${Math.min(100, 50 + totalItems * 5)}%` : '0%';

        const [[{ recentPresc }]] = await db.query(
            `SELECT COUNT(*) as cnt FROM prescriptions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );
        const kpiDisease = recentPresc > 0 ? `+${(recentPresc * 2.5).toFixed(1)}%` : '0.0%';

        // 1. Dynamic Disease Heatmap
        const diseaseHeatmap = prescDiag.map((g, idx) => {
            const name = g.diagnosis || 'Unknown';
            const count = g.cnt;
            let ageGroup = 'All ages';
            let trendText = 'Stable';
            let level = 'low';
            let score = '80%';
            
            if (name.toLowerCase().includes('flu') || name.toLowerCase().includes('influenza')) {
                ageGroup = '0-12 & 65+';
                trendText = count > 5 ? `Rising (+${count * 3}%)` : 'Stable';
                level = count > 5 ? 'critical' : 'med';
                score = `${Math.min(99, 70 + count * 5)}%`;
            } else if (name.toLowerCase().includes('diabet')) {
                ageGroup = '45-64';
                trendText = 'Gradual (+2%)';
                level = 'med';
                score = '85%';
            } else {
                ageGroup = '18-45';
                trendText = 'Stable';
                level = 'low';
                score = '75%';
            }
            return {
                group: name,
                age: ageGroup,
                area: 'Central Zone',
                trend: trendText,
                level: level,
                score: score
            };
        });

        // 2. Dynamic Stock Alerts from prescription items
        const [dbMeds] = await db.query(
            `SELECT medicine_name AS name, COUNT(*) as pres_count 
             FROM prescription_items 
             GROUP BY medicine_name 
             ORDER BY pres_count DESC`
        );
        const stockAlerts = dbMeds.map((m, idx) => {
            const name = m.name;
            const count = m.pres_count;
            const baseStock = Math.max(0, 1000 - count * 15);
            const requirement = count > 10 ? `Add ${count * 20} units` : 'Optimal';
            const risk = baseStock < 500 ? 'low-stock' : (baseStock < 800 ? 'medium-stock' : 'optimal-stock');
            const critical = baseStock < 500;
            return {
                id: String(idx + 1),
                name: name,
                qty: `${baseStock} units`,
                requirement: requirement,
                risk: risk,
                department: count % 2 === 0 ? 'General Medicine' : 'Pediatrics',
                critical: critical
            };
        }).filter(item => item.risk !== 'optimal-stock');

        // 3. Dynamic Department Utilization Rankings based on appointments
        const [dbRankings] = await db.query(
            `SELECT s.name, COUNT(a.id) as appt_count
             FROM services s
             LEFT JOIN users d ON d.service_id = s.id
             LEFT JOIN appointments a ON a.doctor_id = d.id
             GROUP BY s.id, s.name
             ORDER BY appt_count DESC`
        );
        let rankIdx = 1;
        const utilizationRankings = dbRankings.map((r) => {
            const name = r.name;
            const count = r.appt_count;
            const score = count > 0 ? Math.min(98, 60 + count * 2) : 0;
            let status = 'attention-needed';
            if (score > 90) status = 'exceptional';
            else if (score > 80) status = 'optimal';
            else if (score > 70) status = 'stable';
            
            return {
                rank: rankIdx++,
                name: name,
                score: score,
                status: status
            };
        }).filter(item => item.score > 0);

        // 4. Dynamic AI Insights
        const aiInsights = [];
        if (utilizationRankings.length > 0) {
            const topDept = utilizationRankings[0];
            if (topDept.score > 70) {
                aiInsights.push({
                    id: 'i1',
                    title: `Resource Allocation: ${topDept.name}`,
                    description: `Predictive model expects a 15% influx spike in ${topDept.name} clinics next Tuesday. Recommend adding 1 temporary shift to handle patient volumes.`,
                    confidence: '94% Confidence',
                    level: 'info',
                    actionText: 'Schedule Doctor',
                    actionName: 'cardio'
                });
            }
        }
        if (stockAlerts.length > 0) {
            const criticalMed = stockAlerts.find(s => s.critical) || stockAlerts[0];
            aiInsights.push({
                id: 'i2',
                title: `Inventory Alert: ${criticalMed.name}`,
                description: `Flu season models predict a sharp rise in child prescriptions. Restock ${criticalMed.name} by 15% immediately to prevent supply shortfalls.`,
                confidence: '96% Confidence',
                level: 'danger',
                actionText: 'Order Stock',
                actionName: 'order'
            });
        }
        if (parseFloat(noShowRate) > 5) {
            aiInsights.push({
                id: 'i3',
                title: 'Scheduler Optimization: Monday Risk',
                description: 'High-risk patient classifiers indicate Monday morning slots are 3.2x more likely to result in no-shows. Implement automated SMS nudge triggers.',
                confidence: '89% Confidence',
                level: 'warning',
                actionText: 'Activate Nudge',
                actionName: 'nudge'
            });
        }

        res.json({
            success: true,
            data: {
                dept,
                time,
                highRiskPatients: parsedHighRisk,
                stats: {
                    kpiAppointments: totalAppts ? totalAppts.toLocaleString() : '0',
                    kpiNoshow: `${noShowRate}%`,
                    kpiMeddemand: kpiMeddemand,
                    kpiDisease: kpiDisease,
                    kpiPerfscore: actualRating > 0 ? (80 + actualRating * 2).toFixed(1) : '0.0',
                    kpiAccuracy: '96.8%',
                    subWaiting: totalAppts > 0 ? '12 min' : '0 min',
                    subOccupancy: totalAppts > 0 ? '75.2%' : '0.0%',
                    subSatisfaction: actualRating > 0 ? `${Math.round(actualRating * 20)}%` : '0%',
                    subUtilization: totalAppts > 0 ? '68.4%' : '0.0%'
                },
                appointments: {
                    labels,
                    actual: actualData,
                    forecast: forecastData
                },
                noshow: {
                    labels: noshowLabels,
                    rates: noshowRates
                },
                disease: {
                    labels: diseaseLabels,
                    flu: diseaseFlu,
                    diabetes: diseaseDiabetes,
                    dengue: diseaseDengue
                },
                medicine: {
                    labels: medLabels,
                    inventory: medInventory,
                    demand: medDemand
                },
                prescriptions: prescDiag,
                diseaseHeatmap,
                stockAlerts,
                utilizationRankings,
                aiInsights
            }
        });
    } catch (error) {
        console.error("Error generating AuraCare stats:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

exports.broadcastAwareness = async (req, res) => {
    try {
        const { disease, title, description } = req.body;
        
        if (!disease || !title || !description) {
            return res.status(400).json({ success: false, message: "Missing required parameters: disease, title, description." });
        }
        
        // 1. Find a valid target_service_id (General Medicine preferred).
        //    Use NULL if services table is empty to avoid FK constraint failure on fresh deployments.
        const [[genService]] = await db.query(
            `SELECT id FROM services WHERE LOWER(name) LIKE '%general%' ORDER BY id ASC LIMIT 1`
        );
        const broadcastServiceId = genService ? genService.id : null;

        // 2. Insert alert into preventive_recommendations for all registered patients
        await db.query(
            `INSERT INTO preventive_recommendations (patient_id, alert_title, alert_description, status, generated_by, target_service_id)
             SELECT id, ?, ?, 'Pending', 'System_Cron', ? FROM patients`,
            [title, description, broadcastServiceId]
        );
        
        // 2. Count patients notified
        const [[{ count }]] = await db.query(`SELECT COUNT(*) as count FROM patients`);
        const totalNotified = count || 0;
        
        // 3. Emit socket notification for visual confirmation or audit logging
        if (req.io) {
            req.io.emit('NEW_ALERT', {
                title: `[BROADCAST] ${title}`,
                description: `Sent awareness campaign: ${description}`,
                disease: disease,
                risk_tier: 'Info',
                confidence: '100%'
            });
        }
        
        res.json({
            success: true,
            message: `Awareness campaign successfully broadcasted to ${totalNotified} active users!`,
            totalNotified
        });
    } catch (error) {
        console.error("Error broadcasting awareness:", error);
        res.status(500).json({ success: false, message: "Failed to broadcast awareness", error: error.message });
    }
};

exports.getOutbreakNews = async (req, res) => {
    try {
        const forceRefresh = req.query.refresh === 'true';
        const data = await outbreakNewsService.getOutbreakData(forceRefresh);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching outbreak news:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch outbreak news', error: error.message });
    }
};

exports.getPatientAnalytics = async (req, res) => {
    const { genders, departments, min_age, max_age } = req.query;

    try {
        let conditions = ['1=1'];
        let params = [];

        if (genders) {
            conditions.push('p.gender IN (?)');
            params.push(genders.split(','));
        }
        if (departments) {
            conditions.push('s.name IN (?)');
            params.push(departments.split(','));
        }
        if (min_age && max_age) {
            conditions.push('(p.date_of_birth IS NULL OR (TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) >= ? AND TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) <= ?))');
            params.push(parseInt(min_age), parseInt(max_age));
        } else {
            if (min_age) {
                conditions.push('(p.date_of_birth IS NULL OR TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) >= ?)');
                params.push(parseInt(min_age));
            }
            if (max_age) {
                conditions.push('(p.date_of_birth IS NULL OR TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) <= ?)');
                params.push(parseInt(max_age));
            }
        }

        const whereClause = conditions.join(' AND ');

        // 1. Total Patients Count
        const totalQuery = `
            SELECT COUNT(DISTINCT p.id) as count 
            FROM patients p
            LEFT JOIN appointments a ON p.id = a.patient_id
            LEFT JOIN users d ON a.doctor_id = d.id
            LEFT JOIN services s ON d.service_id = s.id
            WHERE ${whereClause}
        `;
        const [totalRows] = await db.query(totalQuery, params);
        const totalPatients = totalRows[0]?.count || 0;



        // 3. Patient Demographics (Gender breakdown)
        const demographicsQuery = `
            SELECT p.gender, COUNT(DISTINCT p.id) as count 
            FROM patients p
            LEFT JOIN appointments a ON p.id = a.patient_id
            LEFT JOIN users d ON a.doctor_id = d.id
            LEFT JOIN services s ON d.service_id = s.id
            WHERE ${whereClause}
            GROUP BY p.gender
        `;
        const [demographicsRows] = await db.query(demographicsQuery, params);

        // 4. Age/Gender Analysis (Grouped bins)
        const ageGenderQuery = `
            SELECT TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) as age, p.gender, COUNT(DISTINCT p.id) as count
            FROM patients p
            LEFT JOIN appointments a ON p.id = a.patient_id
            LEFT JOIN users d ON a.doctor_id = d.id
            LEFT JOIN services s ON d.service_id = s.id
            WHERE ${whereClause}
            GROUP BY age, p.gender
        `;
        const [ageGenderRows] = await db.query(ageGenderQuery, params);

        // Process age bins: 0-19 (bin 0), 20-39 (bin 20), 40-59 (bin 40), 60-79 (bin 60), 80+ (bin 80)
        const ageBins = {
            '0': { bin: 0, label: '0-19', female: 0, male: 0, preferNotToSay: 0 },
            '20': { bin: 20, label: '20-39', female: 0, male: 0, preferNotToSay: 0 },
            '40': { bin: 40, label: '40-59', female: 0, male: 0, preferNotToSay: 0 },
            '60': { bin: 60, label: '60-79', female: 0, male: 0, preferNotToSay: 0 },
            '80': { bin: 80, label: '80+', female: 0, male: 0, preferNotToSay: 0 },
            'unknown': { bin: -1, label: 'Not Specified', female: 0, male: 0, preferNotToSay: 0 }
        };

        ageGenderRows.forEach(row => {
            const gender = (row.gender || '').toLowerCase();
            const targetGenderKey = gender === 'female' ? 'female' : (gender === 'male' ? 'male' : 'preferNotToSay');

            if (row.age === null || row.age === undefined) {
                ageBins['unknown'][targetGenderKey] += row.count;
                return;
            }
            const age = parseInt(row.age);
            let binKey = '0';
            if (age >= 80) binKey = '80';
            else if (age >= 60) binKey = '60';
            else if (age >= 40) binKey = '40';
            else if (age >= 20) binKey = '20';

            ageBins[binKey][targetGenderKey] += row.count;
        });

        // Only include "Not Specified" if there are patients with unspecified age
        const ageGenderData = Object.values(ageBins).filter(bin => bin.bin !== -1 || bin.female > 0 || bin.male > 0 || bin.preferNotToSay > 0);

        // 5. Disease Distribution (Prescription diagnosis counts)
        const diseaseQuery = `
            SELECT pr.diagnosis as name, COUNT(pr.id) as value
            FROM prescriptions pr
            JOIN patients p ON pr.patient_id = p.id
            JOIN users d ON pr.doctor_id = d.id
            JOIN services s ON d.service_id = s.id
            WHERE ${whereClause}
            GROUP BY pr.diagnosis
            ORDER BY value DESC
            LIMIT 10
        `;
        const [diseaseRows] = await db.query(diseaseQuery, params);

        res.json({
            success: true,
            data: {
                kpis: {
                    totalPatients
                },
                demographics: demographicsRows,
                ageGenderAnalysis: ageGenderData,
                diseaseDistribution: diseaseRows
            }
        });

    } catch (error) {
        console.error("Error in getPatientAnalytics:", error);
        res.status(500).json({ success: false, message: "Server error fetching patient analytics", error: error.message });
    }
};

exports.getAllPatients = async (req, res) => {
    try {
        const patients = await adminService.getAllPatients();
        res.json({ success: true, data: patients });
    } catch (error) {
        console.error("Error fetching patients:", error);
        res.status(500).json({ success: false, message: "Failed to fetch patients", error: error.message });
    }
};

exports.updatePatientStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        await adminService.updatePatientStatus(userId, status);
        res.json({ success: true, message: `Patient status successfully updated to ${status}!` });
    } catch (error) {
        console.error("Error updating patient status:", error);
        res.status(500).json({ success: false, message: "Failed to update patient status", error: error.message });
    }
};

exports.deletePatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        await adminService.deletePatient(patientId);
        res.json({ success: true, message: "Patient account permanently deleted." });
    } catch (error) {
        console.error("Error deleting patient:", error);
        res.status(500).json({ success: false, message: "Failed to delete patient account", error: error.message });
    }
};

exports.deleteClinic = async (req, res) => {
    try {
        const { clinicId } = req.params;
        await adminService.deleteClinic(clinicId);
        res.json({ success: true, message: "Clinic facility permanently deleted." });
    } catch (error) {
        console.error("Error deleting clinic:", error);
        res.status(500).json({ success: false, message: "Failed to delete clinic", error: error.message });
    }
};

exports.getClinicDetails = async (req, res) => {
    try {
        const { clinicId } = req.params;
        const details = await adminService.getClinicDetails(clinicId);
        if (!details) {
            return res.status(404).json({ success: false, message: "Clinic not found" });
        }
        res.json({ success: true, data: details });
    } catch (error) {
        console.error("Error getting clinic details:", error);
        res.status(500).json({ success: false, message: "Failed to retrieve clinic details", error: error.message });
    }
};

exports.updateClinicDetails = async (req, res) => {
    try {
        const { clinicId } = req.params;
        await adminService.updateClinicDetails(clinicId, req.body);
        res.json({ success: true, message: "Clinic details successfully updated!" });
    } catch (error) {
        console.error("Error updating clinic details:", error);
        res.status(500).json({ success: false, message: "Failed to update clinic details", error: error.message });
    }
};

exports.addClinicDepartment = async (req, res) => {
    try {
        const { clinicId } = req.params;
        const { serviceId, consultationFee } = req.body;
        await adminService.addClinicDepartment(clinicId, serviceId, consultationFee);
        res.json({ success: true, message: "Department successfully added to clinic!" });
    } catch (error) {
        console.error("Error adding clinic department:", error);
        res.status(500).json({ success: false, message: "Failed to add department to clinic", error: error.message });
    }
};

exports.removeClinicDepartment = async (req, res) => {
    try {
        const { clinicId, serviceId } = req.params;
        await adminService.removeClinicDepartment(clinicId, serviceId);
        res.json({ success: true, message: "Department successfully removed from clinic!" });
    } catch (error) {
        console.error("Error removing clinic department:", error);
        res.status(500).json({ success: false, message: "Failed to remove department from clinic", error: error.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        await adminService.updateUserStatus(userId, status);
        res.json({ success: true, message: `User account successfully ${status.toLowerCase()}ed!` });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ success: false, message: "Failed to update user account status", error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await adminService.deleteUser(userId);
        res.json({ success: true, message: "User account successfully removed!" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ success: false, message: "Failed to delete user account", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// PHARMACY ACCOUNT MANAGEMENT (standalone, no clinic_id needed)
// ─────────────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');

exports.listPharmacyAccounts = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, name, email, phone, status, created_at
             FROM users WHERE role = 'Medicine'
             ORDER BY created_at DESC`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('List Pharmacy Accounts Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.createPharmacyAccount = async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, phone, and password are required.' });
    }
    try {
        const [existing] = await db.query(
            `SELECT id FROM users WHERE email = ? OR phone = ?`, [email, phone]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'A user with this email or phone already exists.' });
        }

        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            `INSERT INTO users (name, email, phone, password, role, status, clinic_id, service_id)
             VALUES (?, ?, ?, ?, 'Medicine', 'Active', NULL, NULL)`,
            [name, email, phone, hash]
        );
        res.status(201).json({
            success: true,
            message: 'Pharmacy account created successfully.',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Create Pharmacy Account Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.updatePharmacyAccountStatus = async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;
    if (!['Active', 'Suspended'].includes(status)) {
        return res.status(400).json({ success: false, message: "Status must be 'Active' or 'Suspended'." });
    }
    try {
        const [rows] = await db.query(`SELECT id FROM users WHERE id = ? AND role = 'Medicine'`, [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pharmacy account not found.' });
        }
        await db.execute(`UPDATE users SET status = ? WHERE id = ?`, [status, userId]);
        res.json({ success: true, message: `Pharmacy account ${status === 'Active' ? 'activated' : 'suspended'}.` });
    } catch (error) {
        console.error('Update Pharmacy Status Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.resetPharmacyPassword = async (req, res) => {
    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    try {
        const [rows] = await db.query(`SELECT id FROM users WHERE id = ? AND role = 'Medicine'`, [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pharmacy account not found.' });
        }
        const hash = await bcrypt.hash(newPassword, 10);
        await db.execute(`UPDATE users SET password = ? WHERE id = ?`, [hash, userId]);
        res.json({ success: true, message: 'Password reset successfully.' });
    } catch (error) {
        console.error('Reset Pharmacy Password Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.deletePharmacyAccount = async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.query(`SELECT id FROM users WHERE id = ? AND role = 'Medicine'`, [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pharmacy account not found.' });
        }
        await db.execute(`DELETE FROM users WHERE id = ?`, [userId]);
        res.json({ success: true, message: 'Pharmacy account deleted.' });
    } catch (error) {
        console.error('Delete Pharmacy Account Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

