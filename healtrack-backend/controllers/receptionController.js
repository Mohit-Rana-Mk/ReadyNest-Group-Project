const db = require('../config/db');
const receptionService = require('../services/receptionService');

exports.getQueue = async (req, res) => {
    try {
        const queueData = await receptionService.getQueue(req.params.clinicId);
        res.status(200).json(queueData);
    } catch (error) {
        console.error('getQueue Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.checkIn = async (req, res) => {
    try {
        const { clinicId, appointmentId } = req.params;
        await receptionService.checkIn(clinicId, appointmentId);
        if (req.io) req.io.emit('QUEUE_UPDATE', { clinicId });
        res.status(200).json({ message: 'Patient Checked-In Successfully' });
    } catch (error) {
        console.error('checkIn Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { clinicId, appointmentId } = req.params;
        await receptionService.updateStatus(clinicId, appointmentId, req.body.status);
        if (req.io) req.io.emit('QUEUE_UPDATE', { clinicId });
        res.status(200).json({ message: 'Status Updated Successfully' });
    } catch (error) {
        if (error.message === 'Status is required') {
            return res.status(400).json({ message: error.message });
        }
        console.error('updateStatus Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.lookupPatient = async (req, res) => {
    try {
        const result = await receptionService.lookupPatient(req.query.phone);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Phone is required') {
            return res.status(400).json({ message: error.message });
        }
        console.error('lookupPatient Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.registerWalkIn = async (req, res) => {
    try {
        const { clinicId } = req.params;
        await receptionService.registerWalkIn(clinicId, req.body);
        
        if (req.io) {
            req.io.emit('QUEUE_UPDATE', {
                clinicId,
                doctorId: req.body.doctor_id,
                message: 'A new walk-in patient has been registered'
            });
        }
        res.status(201).json({ message: 'Walk-In Registered Successfully' });
    } catch (error) {
        if (['doctor_id is required', 'Name is required for new patient'].includes(error.message)) {
            return res.status(400).json({ message: error.message });
        }
        console.error('registerWalkIn Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
