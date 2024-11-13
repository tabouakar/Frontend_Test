// Message formatting utilities
const formatMessage = (text) => {
    // URL detection and linkification
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);

    // List formatting
    text = text.replace(/^\s*[-*]\s+(.+)/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Line breaking
    text = text.replace(/\n/g, '<br>');

    return text;
};

// Error handling
const handleError = (error, messagesDiv) => {
    console.error('Error:', error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message error-message';
    errorDiv.textContent = 'Sorry, something went wrong. Please try again.';
    messagesDiv.appendChild(errorDiv);
};

// Export utilities for use in script.js
window.chatUtils = {
    formatMessage,
    handleError
};
