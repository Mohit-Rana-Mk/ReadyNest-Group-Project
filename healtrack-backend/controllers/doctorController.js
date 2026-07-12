const db = require('../config/db');
const doctorService = require('../services/doctorService');

// Fetch appointments assigned to the logged-in doctor
exports.getAppointments = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const dateFilter = req.query.date_filter || 'today';
        
        const appointments = await doctorService.getAppointments(doctorId, dateFilter);
        res.json({ success: true, data: appointments });
    } catch (error) {
        console.error("Error fetching doctor appointments:", error);
        res.status(500).json({ success: false, message: "Server error fetching appointments", error: error.message });
    }
};

// Fetch patient clinical records history
exports.getPatientHistory = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const patientId = req.params.id;

        // Verify patient-doctor relationship (direct appointment or clinic alignment)
        const [relationship] = await db.query(
            `SELECT a.id FROM appointments a
             WHERE a.patient_id = ?
             AND (
                 a.doctor_id = ?
                 OR a.clinic_id IN (SELECT clinic_id FROM doctor_schedules WHERE doctor_id = ?)
             )
             LIMIT 1`,
            [patientId, doctorId, doctorId]
        );
        if (relationship.length === 0) {
            return res.status(403).json({ success: false, message: "Forbidden: No clinical relationship with this patient." });
        }

        const historyData = await doctorService.getPatientHistory(patientId);
        res.json({ success: true, data: historyData });
    } catch (error) {
        console.error("Error fetching patient history:", error);
        res.status(500).json({ success: false, message: "Server error fetching patient history", error: error.message });
    }
};

// Submit consultation logs and prescriptions (transactional)
exports.completeConsultation = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { appointmentId, patientId } = req.body;

        // Verify doctor owns the appointment and it belongs to the patient
        const [appRows] = await db.query(
            `SELECT id FROM appointments WHERE id = ? AND doctor_id = ? AND patient_id = ?`,
            [appointmentId, doctorId, patientId]
        );
        if (appRows.length === 0) {
            return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access to appointment." });
        }

        const payload = { ...req.body, doctorId };

        const { prescriptionId, doctorName } = await doctorService.completeConsultation(payload);

        if (req.io) {
            req.io.emit('QUEUE_UPDATE', {
                appointmentId: payload.appointmentId,
                patientId: payload.patientId,
                status: 'Completed',
                doctorName,
                message: `${doctorName} has completed a consultation`
            });
        }

        res.json({ success: true, message: "Consultation completed successfully", data: { prescriptionId } });
    } catch (error) {
        if (error.message.startsWith("Missing required fields")) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error("Transaction Error in completeConsultation:", error);
        res.status(500).json({ success: false, message: "Failed to complete consultation", error: error.message });
    }
};

exports.getPatientAnalytics = async (req, res) => {
    const { genders, departments, min_age, max_age } = req.query;

    try {
        const analyticsData = await doctorService.getPatientAnalytics(genders, departments, min_age, max_age);
        res.json({
            success: true,
            data: analyticsData
        });
    } catch (error) {
        console.error("Error in getPatientAnalytics:", error);
        res.status(500).json({ success: false, message: "Server error fetching patient analytics", error: error.message });
    }
};

