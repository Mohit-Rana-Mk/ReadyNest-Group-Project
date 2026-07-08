const { submitTriage } = require('./controllers/patientController');

async function test() {
    const req = {
        body: { user_input: "itching" },
        user: { id: 1 } // fake user id
    };
    
    // We need to mock db
    const db = require('./config/db');
    db.query = async (q, params) => {
        if (q.includes('SELECT id FROM patients')) {
            return [[{ id: 100 }]];
        }
        return [];
    };
    db.execute = async (q, params) => {};
    
    const res = {
        status: (code) => ({
            json: (data) => {
                console.log("Status:", code);
                console.log("Response:", JSON.stringify(data, null, 2));
            }
        })
    };
    
    await submitTriage(req, res);
    process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
