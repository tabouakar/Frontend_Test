document.getElementById('send-button').addEventListener('click', async () => {
    const messageInput = document.getElementById('message-input');
    const chatWindow = document.getElementById('chat-window');
    
    // Get user message
    const userMessage = messageInput.value;
    
    // Display user message
    const userDiv = document.createElement('div');
    userDiv.textContent = userMessage;
    userDiv.className = 'user-message';
    chatWindow.appendChild(userDiv);
    
    // Clear input
    messageInput.value = '';
    
    try {
        // Send to backend
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userMessage })
        });
        
        const data = await response.json();
        
        // Display assistant response
        const assistantDiv = document.createElement('div');
        assistantDiv.textContent = data.response;
        assistantDiv.className = 'assistant-message';
        chatWindow.appendChild(assistantDiv);
    } catch (error) {
        console.error('Error:', error);
        // Display error message
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'Sorry, something went wrong. Please try again.';
        errorDiv.className = 'error-message';
        chatWindow.appendChild(errorDiv);
    }
}); 