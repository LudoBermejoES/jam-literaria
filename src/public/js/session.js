/* eslint-disable no-undef */
document.addEventListener('DOMContentLoaded', () => {
  // Get session ID from the DOM or URL
  const startButton = document.getElementById('start-session-btn');
  let sessionId = startButton ? startButton.getAttribute('data-session-id') : null;
  
  // If sessionId is not found in the button, extract it from the URL
  if (!sessionId) {
    const urlPath = window.location.pathname;
    const urlParts = urlPath.split('/');
    // URL pattern is /session/{sessionId}, so we grab the last part
    if (urlParts.length > 2 && urlParts[1] === 'session') {
      sessionId = urlParts[2];
    }
  }
  
  // Initialize polling system instead of Socket.io
  let lastPollTime = new Date().toISOString();
  let pollingActive = true;
  const POLL_INTERVAL = 1000; // Poll every second for faster updates
  
  // Join session (fetch initial data)
  if (sessionId) {
    // Get user ID from a data attribute or session storage
    const userId = document.body.getAttribute('data-user-id');
    
    // Initial fetch of session data
    fetchSessionUpdates();
    
    console.log(`Connected to session ${sessionId}`);
    
    // Start polling for updates
    startPolling();
  } else {
    console.warn('No session ID found. Polling system not started.');
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
    console.log(`Polling for updates since ${lastPollTime}`);
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
        
        // Debug the data we received
        console.log('Received updates:', JSON.stringify(data, null, 2));
        
        // Process updates
        processUpdates(data);
      })
            .catch(error => {        console.error('Error fetching session updates:', error);      });  }
  
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
    console.log('Current status from server:', data.currentStatus);
    console.log('Is waiting screen?', !!document.querySelector('.session-waiting'));

    // If the session is in ideas collection or voting, but we're on the waiting screen
    if ((data.currentStatus === 'COLLECTING_IDEAS' || data.currentStatus === 'VOTING') && 
        document.querySelector('.session-waiting')) {
      console.log('Session is actively collecting ideas or voting!');
      
      // Show notification about session state change
      showToast(`
        <div class="toast-icon">🚀</div>
        <div class="toast-content">
          <strong>¡La sesión ha cambiado a ${data.currentStatus === 'COLLECTING_IDEAS' ? 'recolección de ideas' : 'votación'}!</strong>
        </div>
      `, 'primary');
      
      // Instead of reloading, find and hide the waiting screen
      const waitingScreen = document.querySelector('.session-waiting');
      if (waitingScreen) {
        waitingScreen.style.display = 'none';
      }
      
      // Show the appropriate interface based on session status
      if (data.currentStatus === 'COLLECTING_IDEAS') {
        // Try to show ideas collection interface if it exists but is hidden
        const ideasSection = document.querySelector('.ideas-collection');
        if (ideasSection) {
          ideasSection.style.display = 'block';
        } else {
          // If ideas collection interface doesn't exist, we'll need to create it
          createIdeasCollectionInterface();
        }
      } else if (data.currentStatus === 'VOTING') {
        // Try to show voting interface if it exists but is hidden
        const votingSection = document.querySelector('.voting-section');
        if (votingSection) {
          votingSection.style.display = 'block';
        } else {
          // If voting interface doesn't exist, we'll need to create it
          createVotingInterface();
        }
      }
    }
    
    // Function to create ideas collection interface dynamically
    function createIdeasCollectionInterface() {
      const mainContent = document.querySelector('main') || document.body;
      const ideasSection = document.createElement('div');
      ideasSection.className = 'ideas-collection';
      ideasSection.innerHTML = `
        <div class="container mt-4">
          <h2>Comparte tus ideas</h2>
          <p>La sesión está activa. Puedes compartir tus ideas ahora.</p>
          <div class="idea-form-container">
            <form id="idea-form">
              <div class="form-group">
                <textarea class="form-control" id="idea-text" rows="3" placeholder="Escribe tu idea aquí..."></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Enviar Idea</button>
            </form>
          </div>
        </div>
      `;
      mainContent.appendChild(ideasSection);
      
      // Set up event listener for the idea form
      const ideaForm = document.getElementById('idea-form');
      if (ideaForm) {
        ideaForm.addEventListener('submit', function(e) {
          e.preventDefault();
          submitIdea();
        });
      }
    }
    
    // Function to create voting interface dynamically
    function createVotingInterface() {
      const mainContent = document.querySelector('main') || document.body;
      const votingSection = document.createElement('div');
      votingSection.className = 'voting-section';
      votingSection.innerHTML = `
        <div class="container mt-4">
          <h2>Votación</h2>
          <p>Es hora de votar por las mejores ideas.</p>
          <div id="ideas-for-voting">
            <p>Cargando ideas para votar...</p>
          </div>
        </div>
      `;
      mainContent.appendChild(votingSection);
      
      // Fetch ideas for voting
      fetch(`/session/${sessionId}/ideas`)
        .then(response => response.json())
        .then(ideas => {
          // Display ideas for voting
          renderIdeasForVoting(ideas);
        })
        .catch(error => {
          console.error('Error fetching ideas for voting:', error);
        });
    }
    
    // Function to render ideas for voting
    function renderIdeasForVoting(ideas) {
      const ideasContainer = document.getElementById('ideas-for-voting');
      if (ideasContainer && ideas && ideas.length > 0) {
        ideasContainer.innerHTML = '';
        
        ideas.forEach(idea => {
          const ideaCard = document.createElement('div');
          ideaCard.className = 'idea-card';
          ideaCard.innerHTML = `
            <div class="card mb-3">
              <div class="card-body">
                <p class="card-text">${idea.text}</p>
                <button class="btn btn-sm btn-outline-primary vote-btn" data-idea-id="${idea.id}">Votar</button>
              </div>
            </div>
          `;
          ideasContainer.appendChild(ideaCard);
          
          // Set up event listener for voting button
          const voteBtn = ideaCard.querySelector('.vote-btn');
          if (voteBtn) {
            voteBtn.addEventListener('click', function() {
              castVote(idea.id);
            });
          }
        });
      } else if (ideasContainer) {
        ideasContainer.innerHTML = '<p>No hay ideas disponibles para votar.</p>';
      }
    }
    
    // Function to submit an idea
    function submitIdea() {
      const ideaText = document.getElementById('idea-text').value.trim();
      if (!ideaText) return;
      
      fetch(`/ideas/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: ideaText })
      })
      .then(response => response.json())
      .then(data => {
        if (data.idea) {
          document.getElementById('idea-text').value = '';
          showToast(`
            <div class="toast-icon">💡</div>
            <div class="toast-content">
              <strong>¡Idea enviada!</strong>
            </div>
          `, 'success');
        } else {
          showToast(`
            <div class="toast-icon">⚠️</div>
            <div class="toast-content">
              <strong>Error:</strong> ${data.error || 'No se pudo enviar la idea'}
            </div>
          `, 'error');
        }
      })
      .catch(error => {
        console.error('Error submitting idea:', error);
        showToast(`
          <div class="toast-icon">⚠️</div>
          <div class="toast-content">
            <strong>Error:</strong> No se pudo enviar la idea
          </div>
        `, 'error');
      });
    }
    
    // Function to cast a vote
    function castVote(ideaId) {
      fetch(`/votes/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ideaId })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showToast(`
            <div class="toast-icon">✅</div>
            <div class="toast-content">
              <strong>¡Voto registrado!</strong>
            </div>
          `, 'success');
          
          // Disable the button after voting
          const voteBtn = document.querySelector(`.vote-btn[data-idea-id="${ideaId}"]`);
          if (voteBtn) {
            voteBtn.disabled = true;
            voteBtn.textContent = 'Votado';
            voteBtn.classList.remove('btn-outline-primary');
            voteBtn.classList.add('btn-success');
          }
        } else {
          showToast(`
            <div class="toast-icon">⚠️</div>
            <div class="toast-content">
              <strong>Error:</strong> ${data.error || 'No se pudo registrar el voto'}
            </div>
          `, 'error');
        }
      })
      .catch(error => {
        console.error('Error casting vote:', error);
        showToast(`
          <div class="toast-icon">⚠️</div>
          <div class="toast-content">
            <strong>Error:</strong> No se pudo registrar el voto
          </div>
        `, 'error');
      });
    }
    
    // Show toast notification only if the session just started
    if (data.sessionStarted) {
      console.log('Session started detected through polling! Status:', data.currentStatus);
      showToast(`
        <div class="toast-icon">🚀</div>
        <div class="toast-content">
          <strong>¡La sesión ha comenzado!</strong>
        </div>
      `, 'primary');
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
  
  // Handle start voting button
  const startVotingButton = document.getElementById('start-voting-btn');
  if (startVotingButton) {
    startVotingButton.addEventListener('click', () => {
      if (startVotingButton.hasAttribute('disabled')) {
        return;
      }
      
      // Confirm before proceeding
      if (!confirm('¿Estás seguro de que quieres avanzar a la fase de votación? No se podrán enviar más ideas.')) {
        return;
      }
      
      // Disable button during API call
      startVotingButton.setAttribute('disabled', 'disabled');
      startVotingButton.textContent = 'Iniciando votación...';
      
      // Call the API to start the voting phase
      fetch(`/session/${sessionId}/start-voting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.error || 'Error al iniciar la votación');
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Voting started:', data);
          showToast(`
            <div class="toast-icon">🗳️</div>
            <div class="toast-content">
              <strong>¡La fase de votación ha comenzado!</strong>
            </div>
          `, 'primary');
          
          // Reload the page to show the voting interface
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        })
        .catch(error => {
          console.error('Error starting voting phase:', error);
          
          // Re-enable button
          startVotingButton.removeAttribute('disabled');
          startVotingButton.textContent = 'Iniciar Votación';
          
          // Show error message
          alert(error.message || 'Error al iniciar la votación. Por favor intenta de nuevo.');
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