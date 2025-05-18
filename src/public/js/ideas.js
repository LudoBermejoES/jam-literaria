/**
 * Ideas functionality for Jam Literaria
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const ideasForm = document.getElementById('ideas-form');
  const ideasList = document.getElementById('ideas-list');
  const myIdeasList = document.getElementById('my-ideas-list');
  const ideaCounter = document.getElementById('idea-counter');
  const maxIdeaCountEl = document.getElementById('max-idea-count');
  const sessionId = document.querySelector('.session-detail-container').dataset.sessionId;
  const userId = document.body.getAttribute('data-user-id');
  
  if (ideasForm) {
    ideasForm.addEventListener('submit', submitIdea);
  }
  
  // Initial load of ideas
  loadMyIdeas();
  
  // Check for updates every 3 seconds
  if (sessionId) {
    setInterval(() => {
      checkForNewIdeas();
    }, 3000);
  }
  
  // Submit a new idea
  async function submitIdea(event) {
    event.preventDefault();
    
    const contentField = document.getElementById('idea-content');
    const content = contentField.value.trim();
    const submitButton = ideasForm.querySelector('button[type="submit"]');
    
    if (!content) {
      showToast('Por favor, escribe una idea antes de enviar', 'error');
      return;
    }
    
    // Disable form while submitting
    contentField.disabled = true;
    submitButton.disabled = true;
    
    try {
      const response = await fetch(`/ideas/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la idea');
      }
      
      // Clear form and re-enable
      contentField.value = '';
      showToast('¡Idea enviada correctamente!', 'success');
      
      // Reload ideas
      loadMyIdeas();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      // Re-enable form
      contentField.disabled = false;
      submitButton.disabled = false;
    }
  }
  
  // Load ideas by the current user
  async function loadMyIdeas() {
    if (!myIdeasList) return;
    
    try {
      const response = await fetch(`/ideas/${sessionId}/mine`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar tus ideas');
      }
      
      // Update idea counter if it exists
      if (ideaCounter && maxIdeaCountEl) {
        const maxIdeas = parseInt(maxIdeaCountEl.textContent, 10);
        ideaCounter.textContent = data.ideas.length;
        
        if (data.ideas.length >= maxIdeas) {
          document.getElementById('ideas-form').classList.add('hidden');
          document.getElementById('max-ideas-message').classList.remove('hidden');
        } else {
          document.getElementById('ideas-form').classList.remove('hidden');
          document.getElementById('max-ideas-message').classList.add('hidden');
        }
      }
      
      // Render my ideas
      renderMyIdeas(data.ideas);
    } catch (error) {
      console.error('Error loading ideas:', error);
      showToast(error.message, 'error');
    }
  }
  
  // Load all ideas for the session (only if in appropriate status)
  async function loadAllIdeas() {
    if (!ideasList) return;
    
    try {
      const response = await fetch(`/ideas/${sessionId}`);
      
      if (!response.ok) {
        // If 403, session might not be in the right state yet
        if (response.status === 403) {
          return;
        }
        
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar las ideas');
      }
      
      const data = await response.json();
      renderAllIdeas(data.ideas);
    } catch (error) {
      console.error('Error loading all ideas:', error);
    }
  }
  
  // Check for new ideas and update view
  async function checkForNewIdeas() {
    try {
      const response = await fetch(`/session/${sessionId}/updates?since=${lastUpdateTime}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener actualizaciones');
      }
      
      // Update timestamp for next poll
      lastUpdateTime = new Date().toISOString();
      
      // If there are new ideas, refresh the ideas lists
      if (data.newIdeas && data.newIdeas.length > 0) {
        loadMyIdeas();
        loadAllIdeas();
      }
      
      // If status changed, check if we should reload the page
      if (data.statusChanged && data.currentStatus !== 'COLLECTING_IDEAS') {
        showToast('La fase de recolección de ideas ha finalizado. Recargando...', 'info');
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }
  
  // Render my ideas
  function renderMyIdeas(ideas) {
    if (!myIdeasList) return;
    
    myIdeasList.innerHTML = '';
    
    if (ideas.length === 0) {
      myIdeasList.innerHTML = '<li class="no-ideas">Aún no has enviado ninguna idea</li>';
      return;
    }
    
    ideas.forEach(idea => {
      const li = document.createElement('li');
      li.className = 'idea-item my-idea';
      
      const content = document.createElement('div');
      content.className = 'idea-content';
      content.textContent = idea.content;
      
      const timestamp = document.createElement('div');
      timestamp.className = 'idea-timestamp';
      timestamp.textContent = new Date(idea.created_at).toLocaleTimeString('es-ES');
      
      li.appendChild(content);
      li.appendChild(timestamp);
      
      // Add delete button if in collection phase
      if (document.querySelector('.session-status').classList.contains('collecting_ideas')) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'idea-delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Eliminar idea';
        deleteBtn.addEventListener('click', () => deleteIdea(idea.id));
        li.appendChild(deleteBtn);
      }
      
      myIdeasList.appendChild(li);
    });
  }
  
  // Render all ideas
  function renderAllIdeas(ideas) {
    if (!ideasList) return;
    
    ideasList.innerHTML = '';
    
    if (ideas.length === 0) {
      ideasList.innerHTML = '<li class="no-ideas">Aún no hay ideas enviadas</li>';
      return;
    }
    
    ideas.forEach(idea => {
      const li = document.createElement('li');
      li.className = 'idea-item';
      li.dataset.ideaId = idea.id;
      
      const content = document.createElement('div');
      content.className = 'idea-content';
      content.textContent = idea.content;
      
      const author = document.createElement('div');
      author.className = 'idea-author';
      author.textContent = idea.author_name;
      
      li.appendChild(content);
      li.appendChild(author);
      
      ideasList.appendChild(li);
    });
  }
  
  // Delete an idea
  async function deleteIdea(ideaId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta idea?')) {
      return;
    }
    
    try {
      const response = await fetch(`/ideas/${sessionId}/idea/${ideaId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar la idea');
      }
      
      showToast('Idea eliminada correctamente', 'success');
      loadMyIdeas();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
  
  // Show toast notification
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    
    document.body.appendChild(toast);
    
    // Animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // Initial timestamp for polling updates
  let lastUpdateTime = new Date().toISOString();
}); 