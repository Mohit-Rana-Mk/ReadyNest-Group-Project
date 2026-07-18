const db = require('./config/db');
(async () => {
const appointmentRepo = require('./repositories/appointmentRepository');
const appointments = await appointmentRepo.getFamilyAppointmentsByUserId(1);
console.log(appointments);
process.exit(0);
})();
