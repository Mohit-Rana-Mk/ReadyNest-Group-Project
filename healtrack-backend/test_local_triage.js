const { submitTriage } = require('./controllers/patientController');
const db = require('./config/db');

async function test() {
    process.env.ML_SERVICE_URL = 'https://healtrack-ml-service.onrender.com';
    const req = {
        body: { user_input: "itching" },
        user: { id: 1 }
    };
    db.query = async () => [[{ id: 100 }]];
    db.execute = async () => {};
    const res = {
        status: (code) => ({
            json: (data) => console.log("Status:", code, JSON.stringify(data, null, 2))
        })
    };
    await submitTriage(req, res);
    process.exit(0);
}

test().catch(e => console.error(e));
