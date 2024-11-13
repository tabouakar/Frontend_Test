const path = require('path');
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const sqlite3 = require('sqlite3');
const session = require('express-session');

console.log('Directory name:', __dirname);
console.log('Full .env path:', path.join(__dirname, '../.env'));
require('dotenv').config({ path: path.join(__dirname, '../.env') });
console.log('Environment variables loaded:', {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Present' : 'Missing',
    ASSISTANT_ID: process.env.ASSISTANT_ID ? 'Present' : 'Missing'
});

const app = express();
app.use(cors());
app.use(express.json());

// Session management for logging
app.use(session({
    secret: 'random_string', // TODO: Replace with a secure secret
    resave: false,
    saveUninitialized: true
}));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Configure sqlite
const db = new sqlite3.Database('chat.logs');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS Logs (
        SessionID TEXT, 
        dt DATETIME DEFAULT CURRENT_TIMESTAMP, 
        UserQuery TEXT, 
        Response TEXT
    )`);
});

// Configure OpenAI API with correct initialization
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
    try {
        const userInput = req.body.message;
        // Request a response from the OpenAI API
        // const response = await openai.chat.completions.create({
        //     model: "gpt-4-turbo-preview",
        //     messages: [{ role: "user", content: userInput }],
        //     temperature: 0.7,    // Controls randomness (0 = deterministic, 1 = creative)
        //     max_tokens: 150,     // Limits response length
        //     presence_penalty: 0.1,  // Encourages the model to talk about new topics
        //     frequency_penalty: 0.1  // Reduces repetition in responses
        // });
        // Create a thread

        // Create a thread
        const thread = await openai.beta.threads.create();

        // Add the user's message to the thread
        await openai.beta.threads.messages.create(
            thread.id,
            { role: "user", content: userInput }
        );

        // Run the assistant
        const run = await openai.beta.threads.runs.create(
            thread.id,
            { assistant_id: process.env.ASSISTANT_ID }
        );

        // Poll for completion
        let runStatus = await openai.beta.threads.runs.retrieve(
            thread.id,
            run.id
        );
        while (runStatus.status !== 'completed') {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            runStatus = await openai.beta.threads.runs.retrieve(
                thread.id,
                run.id
            );
        }

        // Get the assistant response
        const messages = await openai.beta.threads.messages.list(
            thread.id
        );
        const assistantResponse = messages.data[0].content[0].text.value;

        // Insert into logs
        const stmt = db.prepare("INSERT INTO Logs (SessionID, UserQuery, Response) VALUES (?, ?, ?)");
        stmt.run(req.sessionID, userInput, assistantResponse);

        // Send the assistant response back to the frontend
        res.json({ response: assistantResponse });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/logs', (req, res) => {
    db.all("SELECT * FROM Logs ORDER BY dt DESC", (err, rows) => {
        if (err) {
            console.error('Error fetching logs:', err);
            return res.status(500).json({ error: 'Failed to fetch logs' });
        }
        res.json({ logs: rows });
    });
});

app.get('/api/logs/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    db.all("SELECT * FROM Logs WHERE SessionID = ? ORDER BY dt DESC", [sessionId], (err, rows) => {
        if (err) {
            console.error('Error fetching logs:', err);
            return res.status(500).json({ error: 'Failed to fetch logs' });
        }
        res.json({ logs: rows });
    });
});

app.delete('/api/deleteAllLogs', (req, res) => {
    db.run("DELETE FROM Logs", function(err) {
        if (err) {
            console.error('Error deleting logs:', err);
            return res.status(500).json({ error: 'Failed to delete logs' });
        }
        res.status(200).json({ message: 'All logs deleted' });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
