require('dotenv').config();
const { submitTriage } = require('./controllers/patientController');
const db = require('./config/db');

async function test() {
    console.log("ML_SERVICE_URL =", process.env.ML_SERVICE_URL);
    const req = {
        body: { user_input: "itching" },
        user: { id: 1 }
    };
    db.query = async () => [[{ id: 100 }]];
    db.execute = async () => {};
    const res = {
        status: (code) => ({
            json: (data) => console.log(JSON.stringify(data, null, 2))
        })
    };
    await submitTriage(req, res);
    process.exit(0);
}

test().catch(e => console.error(e));
