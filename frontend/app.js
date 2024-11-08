document.getElementById('userInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Updated linkify function to handle parentheses and formatting
function linkify(text) {
    // First, handle line breaks and lists
    text = text.replace(/\n/g, '<br>');
    
    // Handle numbered lists (1. 2. 3. etc)
    text = text.replace(/(\d+\.)\s/g, '<br>$1 ');
    
    // Handle bullet points
    text = text.replace(/•\s/g, '<br>• ');
    text = text.replace(/\*\s/g, '<br>* ');
    
    // Handle URLs - updated regex to exclude trailing punctuation
    const urlRegex = /(https?:\/\/[^\s)]+)/g;
    text = text.replace(urlRegex, function(url) {
        // Remove any trailing punctuation from the URL
        const cleanUrl = url.replace(/[.,;:)]$/, '');
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>`;
    });
    
    // Remove the first <br> if it exists at the start of the text
    text = text.replace(/^<br>/, '');
    
    return text;
}

async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    if (!userInput.trim()) return; // Don't send empty messages
    
    const messagesDiv = document.getElementById('messages');
    const button = document.querySelector('button');
    const input = document.getElementById('userInput');

    // Display user message
    const userMessageDiv = document.createElement('div');
    userMessageDiv.classList.add('message', 'user-message');
    userMessageDiv.innerText = userInput;
    messagesDiv.appendChild(userMessageDiv);
    
    // Clear input and disable controls
    input.value = '';
    input.disabled = true;
    button.disabled = true;
    button.innerText = 'Thinking...';

    // Add loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'loading-message');
    loadingDiv.innerHTML = 'Assistant is typing<span class="typing-indicator"></span>';
    messagesDiv.appendChild(loadingDiv);

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userInput })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Remove loading message
        loadingDiv.remove();

        if (data.error) {
            throw new Error(data.error);
        }

        // Display bot response with clickable links
        const botMessageDiv = document.createElement('div');
        botMessageDiv.classList.add('message', 'bot-message');
        botMessageDiv.innerHTML = linkify(data.response); // Use innerHTML instead of innerText
        messagesDiv.appendChild(botMessageDiv);
        
    } catch (error) {
        console.error('Error:', error);
        // Remove loading message if it exists
        loadingDiv.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('message', 'error-message');
        errorDiv.innerText = error.message || 'Sorry, something went wrong. Please try again.';
        messagesDiv.appendChild(errorDiv);
    } finally {
        // Re-enable controls
        input.disabled = false;
        button.disabled = false;
        button.innerText = 'Send';
        input.focus();
        
        // Auto-scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

document.getElementById('toggleAdminPanel').addEventListener('click', function() {
  const chatInterface = document.getElementById('chatInterface');
  const adminPanel = document.getElementById('adminPanel');
  const button = document.getElementById('toggleAdminPanel');

  if (adminPanel.style.display === 'none') {
      adminPanel.style.display = 'block';
      chatInterface.style.display = 'none';
      button.innerText = 'Back to Chat';
      loadLogs(); 
  } else {
      adminPanel.style.display = 'none';
      chatInterface.style.display = 'block';
      button.innerText = 'Go to Admin Panel';
  }
});