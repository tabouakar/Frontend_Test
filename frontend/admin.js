async function fetchSessionIds() {
  try {
      const response = await fetch('/api/logs');
      const data = await response.json();

      const sessionsList = document.getElementById("sessions-list");

      sessionsList.innerHTML = ""; 

      const uniqueSessions = new Set();

      data.logs.forEach(log => {
          uniqueSessions.add(log.SessionID);
      });
      // Display each unique session ID as clickable items
      uniqueSessions.forEach(sessionId => {
          const sessionItem = document.createElement("div");
          sessionItem.className = "session-item";
          sessionItem.innerHTML = `Session ID: ${sessionId}`;
          console.log("Creating session item for ID:", sessionId);
          sessionItem.onclick = () => fetchLogsForSession(sessionId); // When clicked, fetch logs for this session
          sessionsList.appendChild(sessionItem);
      });
  } catch (error) {
      console.error('Error fetching session IDs:', error);
  }
}

let currentSessionId = null;  // To store the currently displayed session ID

// Fetch logs for a specific session when clicked
async function fetchLogsForSession(sessionId) {
  // Check if the session clicked is already the active session
  if (sessionId === currentSessionId) {
    console.log('This session is already displayed. No action taken.');
    return;  
  }

  try {
      // Fetch logs for the specific session ID
      const response = await fetch(`/api/logs/${sessionId}`);
      const data = await response.json();

      const messagesLog = document.getElementById("messages-log");

      //Clear the log area before adding new logs
      messagesLog.innerHTML = '';

      // Display logs for the selected session
      data.logs.forEach(log => {
          const logItem = document.createElement("div");
          logItem.className = "message-item";
          logItem.innerHTML = `
              <strong>Session ID: ${log.SessionID}</strong> <br>
              <strong>${log.dt}</strong>: ${log.UserQuery} <br>
              Response: ${log.Response}
          `;
          messagesLog.appendChild(logItem);
      });

      // Update the current session ID to the clicked session
      currentSessionId = sessionId;

  } catch (error) {
      console.error('Error fetching logs for session:', error);
  }
}
// Call fetchSessionIds to load the sessions when the page is loaded
document.addEventListener("DOMContentLoaded", fetchSessionIds);

function goBack() {
  window.history.back(); 
}

async function deleteAllLogs() {
  try {
      const confirmation = confirm('Are you sure you want to delete all logs?');
      if (!confirmation) return;  

      const response = await fetch('/api/deleteAllLogs', { method: 'DELETE' });

      if (response.ok) {
          alert('All logs have been deleted.');
          location.reload(); 
      } else {
          alert('Error deleting logs. Please try again.');
      }
  } catch (error) {
      console.error('Error:', error);
      alert('Error deleting logs. Please try again.');
  }
}
