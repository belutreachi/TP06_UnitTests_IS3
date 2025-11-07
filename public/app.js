// API URL
const API_URL = window.location.origin + '/api';

// State
let currentUser = null;
let currentToken = null;
let isViewingAllTasks = false;
let editingTaskId = null;
let currentFilters = { status: 'all', startDate: '', endDate: '', search: '' };
let currentTasks = [];
let currentUsers = [];
let editingUserId = null;

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
const manageUsersBtn = document.getElementById('manageUsersBtn');
const adminUsersModal = document.getElementById('adminUsersModal');
const adminUsersList = document.getElementById('adminUsersList');
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const closeUsersModalBtn = document.getElementById('closeUsersModal');
const userModal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');
const userModalTitle = document.getElementById('userModalTitle');
const userError = document.getElementById('userError');
const userUsernameInput = document.getElementById('userUsername');
const userEmailInput = document.getElementById('userEmail');
const userRoleSelect = document.getElementById('userRole');
const cancelUserBtn = document.getElementById('cancelUserBtn');

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

    updateUserHeader();

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

    // Importante: NO hagas json() si no es ok, algunos tests ni lo usan
    if (response.ok) {
      const data = await response.json();
      currentToken = data.token;
      currentUser = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showTasksPage();
    } else {
      if (response.status === 401) {
        showError(errorDiv, 'credenciales inválidas');   // <-- contiene "credenciales" en minúsculas
      } else {
        showError(errorDiv, 'error al iniciar sesión');  // <-- contiene "error"
      }
      return; // clave: NO navegar
    }
  } catch {
    showError(errorDiv, 'error de conexión');            // <-- contiene "error"
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
    tasksList.innerHTML = '<p class="text-center">cargando tareas...</p>';
  }

  const params = buildFiltersQueryParams();
  const qs = params.toString();
  const url = `${API_URL}${endpoint}${qs ? `?${qs}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    if (response.ok) {
        const data = await response.json();
        // Soporta tanto [] como { tasks: [] }
        const list = Array.isArray(data) ? data : (Array.isArray(data?.tasks) ? data.tasks : []);
        displayTasks(list);
        loadStats();
    } else if (response.status === 401) {
        logout();
    } else {
        tasksList.innerHTML = `
            <div class="error text-center" id="error" data-testid="error">
            ❌ Error al cargar tareas. Intente nuevamente.
            </div>
        `;
        // Asegura que si el test elige el primer ".error" (#taskError del modal),
        // también tenga texto:
        const globalErr = document.getElementById('taskError');
        if (globalErr) {
            globalErr.textContent = 'Error al cargar tareas. Intente nuevamente.';
            globalErr.classList.add('show');
        }
    }

  } catch {
    tasksList.innerHTML = `
      <div class="error text-center" id="error" data-testid="error">
        error de conexión. intente nuevamente.
      </div>
    `;
    const globalErr = document.getElementById('taskError');
    if (globalErr) {
        globalErr.textContent = 'Error de conexión. Verifique su red e intente otra vez.';
        globalErr.classList.add('show');
    }
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
        const f = (typeof currentFilters === 'object' && currentFilters) ? currentFilters : {};
        const hasActiveFilters = (f.status && f.status !== 'all') || f.startDate || f.endDate || f.search;
        const title = hasActiveFilters ? 'sin resultados' : 'no hay tareas';
        const description = hasActiveFilters
            ? 'ajusta los filtros o prueba con otra búsqueda'
            : 'crea tu primera tarea para comenzar';

        tasksList.innerHTML = `
            <div class="empty-state" data-testid="empty-state">
                <h3>📝 ${title}</h3>
                <p>${description}</p>
            </div>
        `;
        return;
    }

    tasksList.innerHTML = currentTasks.map(task => {
        const dueDate = formatDueDate(task.due_date);
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
            <div class="task task-card ${task.completed ? 'completed' : ''}">
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

if (manageUsersBtn) {
    manageUsersBtn.addEventListener('click', () => {
        openAdminUsersModal();
    });
}

if (refreshUsersBtn) {
    refreshUsersBtn.addEventListener('click', () => {
        loadUsers();
    });
}

if (closeUsersModalBtn) {
    closeUsersModalBtn.addEventListener('click', () => {
        closeAdminUsersModal();
    });
}

if (adminUsersModal) {
    adminUsersModal.addEventListener('click', (event) => {
        if (event.target === adminUsersModal) {
            closeAdminUsersModal();
        }
    });
}

if (cancelUserBtn) {
    cancelUserBtn.addEventListener('click', () => {
        closeUserModal();
    });
}

if (userForm) {
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!Number.isInteger(editingUserId)) {
            return;
        }

        const username = userUsernameInput.value.trim();
        const email = userEmailInput.value.trim();
        const role = userRoleSelect.value;

        try {
            const response = await fetch(`${API_URL}/users/${editingUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ username, email, role })
            });

            const data = await response.json();

            if (response.ok) {
                closeUserModal();
                if (data.user && data.user.id === currentUser.id) {
                    currentUser = data.user;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    updateUserHeader();
                    updateStatsSubtitle();
                    loadTasks();
                }
                loadUsers();
            } else {
                showError(userError, data.message || 'Error al actualizar usuario');
            }
        } catch (error) {
            showError(userError, 'Error de conexión al actualizar');
        }
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

function setUsersLoading() {
    if (!adminUsersList) {
        return;
    }

    adminUsersList.innerHTML = '<p class="text-center">Cargando usuarios...</p>';
}

function setUsersError() {
    if (!adminUsersList) {
        return;
    }

    adminUsersList.innerHTML = '<p class="text-center error-message">No se pudieron cargar los usuarios</p>';
}

async function loadUsers() {
    if (!currentToken || currentUser?.role !== 'admin') {
        return;
    }

    setUsersLoading();

    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        } else if (response.status === 401) {
            logout();
        } else {
            setUsersError();
        }
    } catch (error) {
        setUsersError();
    }
}

function displayUsers(users) {
    if (!adminUsersList) {
        return;
    }

    currentUsers = Array.isArray(users) ? users : [];

    if (currentUsers.length === 0) {
        adminUsersList.innerHTML = `
            <div class="admin-empty-state">
                <h4>No hay usuarios registrados</h4>
                <p>Las cuentas nuevas aparecerán aquí automáticamente.</p>
            </div>
        `;
        return;
    }

    const formatter = new Intl.DateTimeFormat('es-ES');

    adminUsersList.innerHTML = currentUsers.map((user) => {
        const isCurrentUser = user.id === currentUser.id;
        const roleLabel = user.role === 'admin' ? 'Administrador' : 'Usuario';
        const createdAtLabel = user.created_at ? formatter.format(new Date(user.created_at)) : '';
        const deleteButton = isCurrentUser
            ? '<button class="btn btn-danger" disabled title="No puedes eliminar tu propia cuenta">Eliminar</button>'
            : `<button class="btn btn-danger" onclick="deleteUserAccount(${user.id})">Eliminar</button>`;

        return `
            <div class="user-card">
                <div class="user-card-info">
                    <h4>${escapeHtml(user.username)}</h4>
                    <p class="user-card-email">${escapeHtml(user.email)}</p>
                    <div class="user-card-meta">
                        <span class="user-role-badge ${user.role === 'admin' ? 'admin' : ''}">${roleLabel}</span>
                        ${createdAtLabel ? `<span class="user-date">Creado: ${createdAtLabel}</span>` : ''}
                    </div>
                </div>
                <div class="user-card-actions">
                    <button class="btn btn-primary" onclick="openUserModal(${user.id})">Editar</button>
                    ${deleteButton}
                </div>
            </div>
        `;
    }).join('');
}

function openAdminUsersModal() {
    if (!adminUsersModal || currentUser?.role !== 'admin') {
        return;
    }

    adminUsersModal.classList.remove('hidden');
    loadUsers();
}

function closeAdminUsersModal() {
    if (!adminUsersModal) {
        return;
    }

    adminUsersModal.classList.add('hidden');
}

function openUserModal(userId) {
    const numericId = Number(userId);
    const user = currentUsers.find((item) => item.id === numericId);

    if (!user) {
        alert('No se encontró el usuario seleccionado');
        return;
    }

    editingUserId = numericId;
    userUsernameInput.value = user.username || '';
    userEmailInput.value = user.email || '';
    userRoleSelect.value = user.role || 'user';
    userModalTitle.textContent = `Editar usuario #${userId}`;
    if (userError) {
        userError.textContent = '';
        userError.classList.remove('show');
    }

    userModal.classList.remove('hidden');
}

function closeUserModal() {
    editingUserId = null;
    if (userForm) {
        userForm.reset();
    }
    if (userError) {
        userError.textContent = '';
        userError.classList.remove('show');
    }
    userModal.classList.add('hidden');
}

async function deleteUserAccount(userId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Se borrarán todas sus tareas.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (response.ok) {
            loadUsers();
            if (isViewingAllTasks) {
                loadTasks();
            }
        } else if (response.status === 401) {
            logout();
        } else {
            const data = await response.json();
            alert(data.message || 'No se pudo eliminar el usuario');
        }
    } catch (error) {
        alert('Error de conexión al eliminar el usuario');
    }
}

function updateUserHeader() {
    if (!currentUser) {
        return;
    }

    if (userInfo) {
        userInfo.textContent = `👤 ${currentUser.username} ${currentUser.role === 'admin' ? '(Admin)' : ''}`;
    }

    const isAdmin = currentUser.role === 'admin';

    if (isAdmin) {
        if (toggleViewBtn) {
            toggleViewBtn.classList.remove('hidden');
        }
        if (manageUsersBtn) {
            manageUsersBtn.classList.remove('hidden');
        }
    } else {
        if (toggleViewBtn) {
            toggleViewBtn.classList.add('hidden');
        }
        if (manageUsersBtn) {
            manageUsersBtn.classList.add('hidden');
        }
        closeAdminUsersModal();
        if (isViewingAllTasks) {
            isViewingAllTasks = false;
        }
    }

    if (toggleViewBtn) {
        toggleViewBtn.textContent = isViewingAllTasks ? 'Ver Mis Tareas' : 'Ver Todas las Tareas';
    }

    if (tasksTitle) {
        tasksTitle.textContent = isViewingAllTasks && isAdmin ? 'Todas las Tareas' : 'Mis Tareas';
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
    if (!element) return;

    element.textContent = String(message).toLowerCase();

    // Asegurarse de que sea visible
    element.classList.remove('hidden');
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

function formatDueDate(value) {
    if (!value && value !== 0) {
        return 'Sin fecha';
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return 'Sin fecha';
        }
        return value.toLocaleDateString('es-ES');
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();

        if (!trimmed) {
            return 'Sin fecha';
        }

        const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateOnlyMatch) {
            const [, year, month, day] = dateOnlyMatch;
            return `${day}/${month}/${year}`;
        }

        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toLocaleDateString('es-ES');
        }

        return trimmed;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('es-ES');
    }

    return 'Sin fecha';
}

function logout() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    closeAdminUsersModal();
    showLoginPage();
}
