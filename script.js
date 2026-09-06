// Get DOM elements
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');

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

function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    // Create task object
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false
    };

    // Add to DOM
    addTaskToDOM(task);

    // Save to localStorage
    saveTasks();

    // Clear input
    taskInput.value = '';
    taskInput.focus();

    // Update stats
    updateStats();
}

function addTaskToDOM(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) {
        li.classList.add('completed');
    }

    li.innerHTML = `
        <input 
            type="checkbox" 
            class="task-checkbox" 
            ${task.completed ? 'checked' : ''}
            onchange="toggleTask(${task.id})"
        >
        <span class="task-text">${escapeHtml(task.text)}</span>
        <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
    `;

    taskList.appendChild(li);
}

function toggleTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        reloadTasks();
        updateStats();
    }
}

function deleteTask(id) {
    const tasks = getTasks();
    const updatedTasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    reloadTasks();
    updateStats();
}

function getTasks() {
    const tasksJson = localStorage.getItem('tasks');
    return tasksJson ? JSON.parse(tasksJson) : [];
}

function saveTasks() {
    const tasks = [];
    document.querySelectorAll('.task-item').forEach(li => {
        const checkbox = li.querySelector('.task-checkbox');
        const taskText = li.querySelector('.task-text').textContent;
        
        tasks.push({
            id: parseInt(li.querySelector('.task-checkbox').onchange.toString().match(/\d+/)[0]),
            text: taskText,
            completed: checkbox.checked
        });
    });

    // Alternative: get from getTasks() which reads from localStorage
    const allTasks = getTasks();
    localStorage.setItem('tasks', JSON.stringify(allTasks));
}

function loadTasks() {
    const tasks = getTasks();
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        addTaskToDOM(task);
    });

    updateStats();
}

function reloadTasks() {
    taskList.innerHTML = '';
    loadTasks();
}

function updateStats() {
    const tasks = getTasks();
    const completedCount = tasks.filter(t => t.completed).length;
    
    totalTasksSpan.textContent = tasks.length;
    completedTasksSpan.textContent = completedCount;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
