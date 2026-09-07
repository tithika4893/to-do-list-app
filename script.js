// Get DOM elements
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDateInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const pendingTasksSpan = document.getElementById('pendingTasks');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const exportBtn = document.getElementById('exportBtn');

let currentFilter = 'all';
let isEditing = false;
let editingId = null;

// Load tasks from localStorage when page loads
document.addEventListener('DOMContentLoaded', loadTasks);

// Add task when button is clicked
addBtn.addEventListener('click', addTask);

// Add task when Enter key is pressed
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Search functionality
searchInput.addEventListener('input', filterAndRenderTasks);

// Filter buttons
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        filterAndRenderTasks();
    });
});

// Clear completed tasks
clearCompletedBtn.addEventListener('click', clearCompletedTasks);

// Export tasks
exportBtn.addEventListener('click', exportTasks);

function addTask() {
    const taskText = taskInput.value.trim();
    const priority = prioritySelect.value;
    const dueDate = dueDateInput.value;
    
    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    if (isEditing) {
        updateTask(editingId, taskText, priority, dueDate);
        isEditing = false;
        editingId = null;
        addBtn.textContent = 'Add Task';
    } else {
        // Create task object
        const task = {
            id: Date.now(),
            text: taskText,
            priority: priority,
            dueDate: dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };

        // Get current tasks
        const tasks = getTasks();
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Clear input
    taskInput.value = '';
    dueDateInput.value = '';
    prioritySelect.value = 'medium';
    taskInput.focus();

    // Reload and update
    loadTasks();
    updateStats();
}

function updateTask(id, text, priority, dueDate) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    
    if (task) {
        task.text = text;
        task.priority = priority;
        task.dueDate = dueDate;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTasks();
        updateStats();
    }
}

function editTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    
    if (task) {
        taskInput.value = task.text;
        prioritySelect.value = task.priority;
        dueDateInput.value = task.dueDate || '';
        isEditing = true;
        editingId = id;
        addBtn.textContent = 'Update Task';
        taskInput.focus();
    }
}

function addTaskToDOM(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.priority = task.priority;
    
    if (task.completed) {
        li.classList.add('completed');
    }

    const dueDateDisplay = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date';
    const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date() ? 'overdue' : '';

    li.innerHTML = `
        <div class="task-content">
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
                onchange="toggleTask(${task.id})"
            >
            <div class="task-details">
                <span class="task-text">${escapeHtml(task.text)}</span>
                <div class="task-meta">
                    <span class="priority-badge priority-${task.priority}">${task.priority.toUpperCase()}</span>
                    <span class="due-date ${isOverdue}">${dueDateDisplay}</span>
                </div>
            </div>
        </div>
        <div class="task-actions">
            <button class="edit-btn" onclick="editTask(${task.id})" title="Edit">✏️</button>
            <button class="delete-btn" onclick="deleteTask(${task.id})" title="Delete">🗑️</button>
        </div>
    `;

    taskList.appendChild(li);
}

function toggleTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    
    if (task) {
        task.completed = !task.completed;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        filterAndRenderTasks();
        updateStats();
    }
}

function deleteTask(id) {
    const tasks = getTasks();
    const updatedTasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    filterAndRenderTasks();
    updateStats();
}

function clearCompletedTasks() {
    const tasks = getTasks();
    const activeTasks = tasks.filter(t => !t.completed);
    localStorage.setItem('tasks', JSON.stringify(activeTasks));
    filterAndRenderTasks();
    updateStats();
}

function getTasks() {
    const tasksJson = localStorage.getItem('tasks');
    return tasksJson ? JSON.parse(tasksJson) : [];
}

function loadTasks() {
    filterAndRenderTasks();
    updateStats();
}

function filterAndRenderTasks() {
    const tasks = getTasks();
    const searchTerm = searchInput.value.toLowerCase();

    taskList.innerHTML = '';

    let filteredTasks = tasks.filter(task => {
        const matchesFilter = 
            currentFilter === 'all' || 
            (currentFilter === 'completed' && task.completed) ||
            (currentFilter === 'pending' && !task.completed);
        
        const matchesSearch = task.text.toLowerCase().includes(searchTerm);
        
        return matchesFilter && matchesSearch;
    });

    // Sort by priority (High > Medium > Low) and then by due date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    filteredTasks.sort((a, b) => {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        return 0;
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<li class="empty-state">No tasks here! 🎉</li>';
    } else {
        filteredTasks.forEach(task => addTaskToDOM(task));
    }
}

function updateStats() {
    const tasks = getTasks();
    const completedCount = tasks.filter(t => t.completed).length;
    const pendingCount = tasks.filter(t => !t.completed).length;
    
    totalTasksSpan.textContent = tasks.length;
    completedTasksSpan.textContent = completedCount;
    pendingTasksSpan.textContent = pendingCount;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function exportTasks() {
    const tasks = getTasks();
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}