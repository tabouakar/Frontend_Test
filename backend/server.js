const path = require('path');
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

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

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

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
        const thread = await openai.beta.threads.create();

        // Add a message to the thread
        await openai.beta.threads.messages.create(
            thread.id,
            {
                role: "user",
                content: userInput
            }
        );

        // Run the assistant
        const run = await openai.beta.threads.runs.create(
            thread.id,
            {
                assistant_id: process.env.ASSISTANT_ID
            }
        );

        // Wait for the run to complete
        let runStatus = await openai.beta.threads.runs.retrieve(
            thread.id,
            run.id
        );

        // Poll for completion
        while (runStatus.status !== 'completed') {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            runStatus = await openai.beta.threads.runs.retrieve(
                thread.id,
                run.id
            );
        }

        // Get the messages
        const messages = await openai.beta.threads.messages.list(
            thread.id
        );

        // Get the last assistant message
        const assistantResponse = messages.data[0].content[0].text.value;
        
        // Send response back to frontend
        res.json({ response: assistantResponse });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
