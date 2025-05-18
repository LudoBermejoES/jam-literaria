/* eslint-disable no-undef */
document.addEventListener('DOMContentLoaded', () => {
  // Get session ID from the DOM
  const startButton = document.getElementById('start-session-btn');
  const sessionId = startButton ? startButton.getAttribute('data-session-id') : null;
  
  // Initialize polling system instead of Socket.io
  let lastPollTime = new Date().toISOString();
  let pollingActive = true;
  const POLL_INTERVAL = 3000; // Poll every 3 seconds
  
  // Join session (fetch initial data)
  if (sessionId) {
    // Get user ID from a data attribute or session storage
    const userId = document.body.getAttribute('data-user-id');
    
    // Initial fetch of session data
    fetchSessionUpdates();
    
    console.log(`Connected to session ${sessionId}`);
    
    // Start polling for updates
    startPolling();
  }
  
  // Poll for updates at regular intervals
  function startPolling() {
    setInterval(() => {
      if (pollingActive && sessionId) {
        fetchSessionUpdates();
      }
    }, POLL_INTERVAL);
  }
  
  // Fetch session updates from server
  function fetchSessionUpdates() {
    fetch(`/session/${sessionId}/updates?since=${encodeURIComponent(lastPollTime)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error fetching updates');
        }
        return response.json();
      })
      .then(data => {
        // Update last poll time for next request
        lastPollTime = new Date().toISOString();
        
        // Process updates
        processUpdates(data);
      })
      .catch(error => {
        console.error('Error fetching session updates:', error);
      });
  }
  
  // Process updates received from the server
  function processUpdates(data) {
    // Process new participants
    if (data.newParticipants && data.newParticipants.length > 0) {
      data.newParticipants.forEach(participant => {
        showToast(`
          <div class="toast-icon">👋</div>
          <div class="toast-content">
            <strong>${participant.name}</strong> se ha unido a la sesión
          </div>
        `, 'success');
        
        updateParticipantsList({
          userId: participant.id,
          userName: participant.name
        });
      });
    }
    
    // Process session status change
    if (data.sessionStarted) {
      showToast(`
        <div class="toast-icon">🚀</div>
        <div class="toast-content">
          <strong>¡La sesión ha comenzado!</strong>
        </div>
      `, 'primary');
      
      // Reload the page to show the ideas form
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
    
    // Process new ideas
    if (data.newIdeas && data.newIdeas.length > 0) {
      data.newIdeas.forEach(idea => {
        showToast(`
          <div class="toast-icon">💡</div>
          <div class="toast-content">
            <strong>${idea.authorName}</strong> ha enviado una idea
          </div>
        `, 'info');
      });
    }
    
    // Process new votes
    if (data.newVotes && data.newVotes.length > 0) {
      data.newVotes.forEach(vote => {
        showToast(`
          <div class="toast-icon">✅</div>
          <div class="toast-content">
            <strong>${vote.userName}</strong> ha votado
          </div>
        `, 'info');
      });
    }
  }
  
  // Handle start session button
  if (startButton) {
    startButton.addEventListener('click', () => {
      if (startButton.hasAttribute('disabled')) {
        return;
      }
      
      // Disable button during API call
      startButton.setAttribute('disabled', 'disabled');
      startButton.textContent = 'Iniciando...';
      
      // Call the API to start the session
      fetch(`/session/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.error || 'Error al iniciar la sesión');
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Session started:', data);
          // The next poll will detect the session status change
        })
        .catch(error => {
          console.error('Error starting session:', error);
          
          // Re-enable button
          startButton.removeAttribute('disabled');
          startButton.textContent = 'Iniciar Sesión';
          
          // Show error message
          alert(error.message || 'Error al iniciar la sesión. Por favor intenta de nuevo.');
        });
    });
  }
  
  // Create toast notification container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Function to show a toast notification
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    
    toastContainer.appendChild(toast);
    
    // Add visible class to trigger animation
    setTimeout(() => {
      toast.classList.add('visible');
    }, 10);
    
    // Remove the toast after 5 seconds
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 300); // Wait for the fade out animation
    }, 5000);
  }
  
  // Function to update the participants list
  function updateParticipantsList(userData) {
    const participantsList = document.getElementById('participants-list');
    const participantCount = document.getElementById('participant-count');
    
    if (participantsList && participantCount) {
      // Skip if the user is already in the list
      const userElements = participantsList.querySelectorAll('.participant');
      for (let i = 0; i < userElements.length; i++) {
        const userEl = userElements[i];
        if (userEl.dataset.userId === userData.userId) {
          console.log('User already in the participant list, skipping');
          return;
        }
      }
      
      // Create a new participant list item
      const listItem = document.createElement('li');
      listItem.className = 'participant';
      listItem.textContent = userData.userName;
      listItem.dataset.userId = userData.userId;
      
      // Add to the list
      participantsList.appendChild(listItem);
      
      // Update the count
      const currentCount = parseInt(participantCount.textContent, 10) || 0;
      participantCount.textContent = currentCount + 1;
      
      // Check if we need to enable the start button
      if (startButton && currentCount + 1 >= 2) {
        startButton.removeAttribute('disabled');
      }
    }
  }
  
  // Clean up when leaving page
  window.addEventListener('beforeunload', () => {
    pollingActive = false;
  });
  
  // Copy session code button
  const copyBtn = document.getElementById('copy-code-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = copyBtn.getAttribute('data-code');
      
      navigator.clipboard.writeText(code)
        .then(() => {
          copyBtn.textContent = 'Copiado!';
          setTimeout(() => {
            copyBtn.textContent = 'Copiar';
          }, 2000);
        })
        .catch(err => {
          console.error('Error copying code:', err);
          alert('No se pudo copiar el código. Por favor cópialo manualmente.');
        });
    });
  }
  
  // Copy session link button
  const copyLinkBtn = document.getElementById('copy-link-btn');
  const sessionLinkInput = document.getElementById('session-link');
  if (copyLinkBtn && sessionLinkInput) {
    copyLinkBtn.addEventListener('click', () => {
      sessionLinkInput.select();
      
      navigator.clipboard.writeText(sessionLinkInput.value)
        .then(() => {
          copyLinkBtn.textContent = 'Copiado!';
          setTimeout(() => {
            copyLinkBtn.textContent = 'Copiar';
          }, 2000);
        })
        .catch(err => {
          console.error('Error copying link:', err);
          alert('No se pudo copiar el enlace. Por favor cópialo manualmente.');
        });
    });
  }
  
  // Delete session button
  const deleteBtn = document.getElementById('delete-session-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que deseas eliminar esta sesión? Esta acción no se puede deshacer.')) {
        const sessionId = deleteBtn.getAttribute('data-session-id');
        
        try {
          const response = await fetch(`/session/${sessionId}/delete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (data.success) {
            window.location.href = '/session'; // Redirect to sessions list
          } else {
            alert(`Error: ${data.error || 'No se pudo eliminar la sesión'}`);
          }
        } catch (error) {
          console.error('Error deleting session:', error);
          alert('Ocurrió un error al intentar eliminar la sesión');
        }
      }
    });
  }
}); 