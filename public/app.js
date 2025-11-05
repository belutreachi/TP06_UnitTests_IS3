// API URL
const API_URL = window.location.origin + '/api';

// State
let currentUser = null;
let currentToken = null;
let isViewingAllTasks = false;
let editingTaskId = null;

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
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (response.ok) {
            const tasks = await response.json();
            displayTasks(tasks);
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

// Display tasks
function displayTasks(tasks) {
    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <h3>📝 No hay tareas</h3>
                <p>Crea tu primera tarea para comenzar</p>
            </div>
        `;
        return;
    }
    
    tasksList.innerHTML = tasks.map(task => {
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('es-ES') : 'Sin fecha';
        const isOwnTask = task.user_id === currentUser.id;
        
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

// Toggle view (admin only)
toggleViewBtn.addEventListener('click', () => {
    isViewingAllTasks = !isViewingAllTasks;
    toggleViewBtn.textContent = isViewingAllTasks ? 'Ver Mis Tareas' : 'Ver Todas las Tareas';
    tasksTitle.textContent = isViewingAllTasks ? 'Todas las Tareas' : 'Mis Tareas';
    loadTasks();
});

// Add task
document.getElementById('addTaskBtn').addEventListener('click', () => {
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = 'Nueva Tarea';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskDueDate').value = '';
    taskModal.classList.remove('hidden');
});

// Cancel task
document.getElementById('cancelTaskBtn').addEventListener('click', () => {
    taskModal.classList.add('hidden');
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
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ title, description, due_date })
        });
        
        if (response.ok) {
            taskModal.classList.add('hidden');
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
async function editTask(id) {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (response.ok) {
            const tasks = await response.json();
            const task = tasks.find(t => t.id === id);
            
            if (task) {
                editingTaskId = id;
                document.getElementById('modalTitle').textContent = 'Editar Tarea';
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDescription').value = task.description || '';
                document.getElementById('taskDueDate').value = task.due_date || '';
                taskModal.classList.remove('hidden');
            }
        }
    } catch (error) {
        alert('Error al cargar la tarea');
    }
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

// Helper functions
function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
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
