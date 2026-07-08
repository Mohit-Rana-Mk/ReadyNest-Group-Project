const user_input = 'I have a headache and mild fever';
const inputLower = user_input.toLowerCase().trim().replace(/[?.!]/g, '');
const validSymptoms = ["headache", "mild_fever", "itching"];
const matchedSymptoms = [];
validSymptoms.forEach(sym => {
    const readableSym = sym.replace(/_/g, ' ');
    if (inputLower.includes(readableSym)) {
        matchedSymptoms.push(sym);
    }
});
console.log("Matched symptoms:", matchedSymptoms);
