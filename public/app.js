// API URL
const API_URL = window.location.origin + '/api';

// State
let currentUser = null;
let currentToken = null;
let isViewingAllTasks = false;
let editingTaskId = null;
let currentFilters = { status: 'all', startDate: '', endDate: '', search: '' };
let currentTasks = [];

// DOM Elements
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const tasksPage = document.getElementById('tasksPage');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const taskForm = document.getElementById('taskForm');
const taskModal = document.getElementById('taskModal');
const tasksList = document.getElementById('tasksList');
const userInfo = document.getElementById('userInfo');
const toggleViewBtn = document.getElementById('toggleViewBtn');
const tasksTitle = document.getElementById('tasksTitle');
const filtersForm = document.getElementById('filtersForm');
const filterStatus = document.getElementById('filterStatus');
const filterStartDate = document.getElementById('filterStartDate');
const filterEndDate = document.getElementById('filterEndDate');
const filterSearch = document.getElementById('filterSearch');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const statsSection = document.getElementById('statsSection');
const statsSubtitle = document.getElementById('statsSubtitle');
const statsCompletedValue = document.getElementById('statsCompleted');
const statsPendingValue = document.getElementById('statsPending');
const statsTotalValue = document.getElementById('statsTotal');
const statsProgressText = document.getElementById('statsProgressText');
const statsProgressBar = document.getElementById('statsProgressBar');
const taskAttachmentsInput = document.getElementById('taskAttachments');

// Check if user is logged in
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentToken = token;
        currentUser = JSON.parse(user);
        showTasksPage();
    } else {
        showLoginPage();
    }
});

// Show/Hide pages
function showLoginPage() {
    loginPage.classList.remove('hidden');
    registerPage.classList.add('hidden');
    tasksPage.classList.add('hidden');
}

function showRegisterPage() {
    loginPage.classList.add('hidden');
    registerPage.classList.remove('hidden');
    tasksPage.classList.add('hidden');
}

function showTasksPage() {
    loginPage.classList.add('hidden');
    registerPage.classList.add('hidden');
    tasksPage.classList.remove('hidden');
    
    userInfo.textContent = `👤 ${currentUser.username} ${currentUser.role === 'admin' ? '(Admin)' : ''}`;
    
    // Show toggle button only for admin
    if (currentUser.role === 'admin') {
        toggleViewBtn.classList.remove('hidden');
    } else {
        toggleViewBtn.classList.add('hidden');
    }

    if (filtersForm) {
        filtersForm.reset();
        syncFiltersFromForm();
    }

    updateStatsSubtitle();
    loadTasks();
}

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showTasksPage();
        } else {
            showError(errorDiv, data.message || 'Error al iniciar sesión');
        }
    } catch (error) {
        showError(errorDiv, 'Error de conexión');
    }
});

// Register
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showTasksPage();
        } else {
            showError(errorDiv, data.message || 'Error al registrarse');
        }
    } catch (error) {
        showError(errorDiv, 'Error de conexión');
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showLoginPage();
});

// Toggle between login and register
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterPage();
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginPage();
});

// Load tasks
async function loadTasks() {
    const endpoint = isViewingAllTasks ? '/tasks/all' : '/tasks';

    if (tasksList) {
        tasksList.innerHTML = '<p class="text-center">Cargando tareas...</p>';
    }

    const params = buildFiltersQueryParams();
    const queryString = params.toString();
    const url = `${API_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (response.ok) {
            const tasks = await response.json();
            displayTasks(tasks);
            loadStats();
        } else if (response.status === 401) {
            // Token expired
            logout();
        } else {
            tasksList.innerHTML = '<p class="text-center">Error al cargar tareas</p>';
        }
    } catch (error) {
        tasksList.innerHTML = '<p class="text-center">Error de conexión</p>';
    }
}

function buildFiltersQueryParams() {
    const params = new URLSearchParams();

    if (currentFilters.status && currentFilters.status !== 'all') {
        params.set('status', currentFilters.status);
    }

    if (currentFilters.startDate) {
        params.set('startDate', currentFilters.startDate);
    }

    if (currentFilters.endDate) {
        params.set('endDate', currentFilters.endDate);
    }

    if (currentFilters.search) {
        params.set('search', currentFilters.search);
    }

    return params;
}

async function loadStats() {
    if (!statsSection || !currentToken) {
        return;
    }

    setStatsLoading();

    const params = buildFiltersQueryParams();
    if (isViewingAllTasks && currentUser?.role === 'admin') {
        params.set('view', 'all');
    }

    const queryString = params.toString();
    const url = `${API_URL}/tasks/stats${queryString ? `?${queryString}` : ''}`;

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (response.ok) {
            const stats = await response.json();
            updateStatsValues(stats);
        } else if (response.status === 401) {
            logout();
        } else {
            setStatsError();
        }
    } catch (error) {
        setStatsError();
    }
}

function setStatsLoading() {
    if (!statsCompletedValue) {
        return;
    }

    statsCompletedValue.textContent = '...';
    statsPendingValue.textContent = '...';
    statsTotalValue.textContent = '...';
    statsProgressText.textContent = '...';
    statsProgressBar.style.width = '0%';
}

function setStatsError() {
    if (!statsCompletedValue) {
        return;
    }

    statsCompletedValue.textContent = '—';
    statsPendingValue.textContent = '—';
    statsTotalValue.textContent = '—';
    statsProgressText.textContent = '—';
    statsProgressBar.style.width = '0%';
}

function updateStatsValues(stats = {}) {
    if (!statsCompletedValue) {
        return;
    }

    const completed = Number(stats.completed) || 0;
    const pending = Number(stats.pending) || 0;
    const total = Number(stats.total) || 0;
    const progress = Number(stats.progress) || 0;

    statsCompletedValue.textContent = completed;
    statsPendingValue.textContent = pending;
    statsTotalValue.textContent = total;
    statsProgressText.textContent = `${progress}%`;
    statsProgressBar.style.width = `${progress}%`;
}

function updateStatsSubtitle() {
    if (!statsSubtitle) {
        return;
    }

    const viewingAll = isViewingAllTasks && currentUser?.role === 'admin';
    statsSubtitle.textContent = viewingAll ? 'Resumen de todas las tareas' : 'Resumen de tus tareas';
}

// Display tasks
function displayTasks(tasks) {
    currentTasks = Array.isArray(tasks) ? tasks : [];

    if (currentTasks.length === 0) {
        const hasActiveFilters = currentFilters.status !== 'all' || currentFilters.startDate || currentFilters.endDate || currentFilters.search;
        const title = hasActiveFilters ? 'Sin resultados' : 'No hay tareas';
        const description = hasActiveFilters
            ? 'Ajusta los filtros o prueba con otra búsqueda'
            : 'Crea tu primera tarea para comenzar';

        tasksList.innerHTML = `
            <div class="empty-state">
                <h3>📝 ${title}</h3>
                <p>${description}</p>
            </div>
        `;
        return;
    }

    tasksList.innerHTML = currentTasks.map(task => {
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('es-ES') : 'Sin fecha';
        const isOwnTask = task.user_id === currentUser.id;
        const attachments = Array.isArray(task.attachments) ? task.attachments : [];

        const attachmentsItems = attachments.map(attachment => {
            const safeName = escapeHtml(attachment.name || 'Archivo');
            const sizeLabel = typeof attachment.size === 'number' && !Number.isNaN(attachment.size)
                ? `<span class="attachment-size">(${formatFileSize(attachment.size)})</span>`
                : '';
            const attachmentUrl = typeof attachment.url === 'string' ? attachment.url : '#';
            const removeButton = isOwnTask
                ? `<button class="attachment-remove" onclick="deleteAttachment(${task.id}, ${attachment.id})" title="Eliminar adjunto">✕</button>`
                : '';

            return `
                <li>
                    <a href="${attachmentUrl}" target="_blank" rel="noopener">
                        ${safeName} ${sizeLabel}
                    </a>
                    ${removeButton}
                </li>
            `;
        }).join('');

        const attachmentsSection = attachments.length ? `
                <div class="task-attachments">
                    <div class="task-attachments-header">
                        <span>📎 Adjuntos (${attachments.length})</span>
                    </div>
                    <ul class="attachments-list">
                        ${attachmentsItems}
                    </ul>
                </div>
        ` : '';

        return `
            <div class="task-card ${task.completed ? 'completed' : ''}">
                <div class="task-header">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                </div>
                <div class="task-meta">
                    <span class="task-badge">📅 ${dueDate}</span>
                    ${isViewingAllTasks ? `<span class="task-badge admin">👤 ${escapeHtml(task.username)}</span>` : ''}
                    <span class="task-badge">${task.completed ? '✅ Completada' : '⏳ Pendiente'}</span>
                </div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                ${attachmentsSection}
                ${isOwnTask ? `
                <div class="task-actions">
                    <button class="btn btn-success" onclick="toggleComplete(${task.id})">
                        ${task.completed ? 'Marcar Pendiente' : 'Completar'}
                    </button>
                    <button class="btn btn-primary" onclick="editTask(${task.id})">Editar</button>
                    <button class="btn btn-danger" onclick="deleteTask(${task.id})">Eliminar</button>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

if (filtersForm) {
    filtersForm.addEventListener('submit', (e) => {
        e.preventDefault();
        syncFiltersFromForm();
        loadTasks();
    });
}

if (clearFiltersBtn && filtersForm) {
    clearFiltersBtn.addEventListener('click', () => {
        filtersForm.reset();
        syncFiltersFromForm();
        loadTasks();
    });
}

// Toggle view (admin only)
toggleViewBtn.addEventListener('click', () => {
    isViewingAllTasks = !isViewingAllTasks;
    toggleViewBtn.textContent = isViewingAllTasks ? 'Ver Mis Tareas' : 'Ver Todas las Tareas';
    tasksTitle.textContent = isViewingAllTasks ? 'Todas las Tareas' : 'Mis Tareas';
    updateStatsSubtitle();
    loadTasks();
});

// Add task
document.getElementById('addTaskBtn').addEventListener('click', () => {
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = 'Nueva Tarea';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskDueDate').value = '';
    if (taskAttachmentsInput) {
        taskAttachmentsInput.value = '';
    }
    taskModal.classList.remove('hidden');
});

// Cancel task
document.getElementById('cancelTaskBtn').addEventListener('click', () => {
    taskModal.classList.add('hidden');
    if (taskAttachmentsInput) {
        taskAttachmentsInput.value = '';
    }
});

// Submit task
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const due_date = document.getElementById('taskDueDate').value;
    const errorDiv = document.getElementById('taskError');
    
    try {
        const url = editingTaskId 
            ? `${API_URL}/tasks/${editingTaskId}`
            : `${API_URL}/tasks`;
        const method = editingTaskId ? 'PUT' : 'POST';
        
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('due_date', due_date);

        if (taskAttachmentsInput && taskAttachmentsInput.files.length > 0) {
            Array.from(taskAttachmentsInput.files).forEach(file => {
                formData.append('attachments', file);
            });
        }

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });

        if (response.ok) {
            taskModal.classList.add('hidden');
            if (taskAttachmentsInput) {
                taskAttachmentsInput.value = '';
            }
            loadTasks();
        } else {
            const data = await response.json();
            showError(errorDiv, data.message || 'Error al guardar tarea');
        }
    } catch (error) {
        showError(errorDiv, 'Error de conexión');
    }
});

// Edit task
function editTask(id) {
    const task = currentTasks.find(t => t.id === id);

    if (!task) {
        alert('No se encontró la tarea seleccionada');
        return;
    }

    editingTaskId = id;
    document.getElementById('modalTitle').textContent = 'Editar Tarea';
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskDueDate').value = task.due_date || '';
    if (taskAttachmentsInput) {
        taskAttachmentsInput.value = '';
    }
    taskModal.classList.remove('hidden');
}

// Toggle complete
async function toggleComplete(id) {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}/complete`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (response.ok) {
            loadTasks();
        }
    } catch (error) {
        alert('Error al actualizar tarea');
    }
}

// Delete task
async function deleteTask(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (response.ok) {
            loadTasks();
        }
    } catch (error) {
        alert('Error al eliminar tarea');
    }
}

async function deleteAttachment(taskId, attachmentId) {
    if (!confirm('¿Quieres eliminar este archivo adjunto?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/attachments/${attachmentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (response.ok) {
            loadTasks();
        } else if (response.status === 401) {
            logout();
        } else {
            alert('Error al eliminar el archivo adjunto');
        }
    } catch (error) {
        alert('Error de conexión al eliminar el archivo');
    }
}

// Helper functions
function syncFiltersFromForm() {
    if (!filtersForm) {
        return;
    }

    currentFilters = {
        status: filterStatus.value,
        startDate: filterStartDate.value,
        endDate: filterEndDate.value,
        search: filterSearch.value.trim()
    };
}

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

function formatFileSize(bytes) {
    const value = Number(bytes);

    if (!Number.isFinite(value) || value < 0) {
        return '';
    }

    if (value >= 1024 * 1024) {
        return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    }

    if (value >= 1024) {
        return `${Math.round(value / 1024)} KB`;
    }

    return `${value} B`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function logout() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showLoginPage();
}
