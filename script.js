let tasks = [];
        let editingTaskId = null;
        let currentFilter = 'all';

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            loadTasks();
            renderTasks();
            
            // Set today's date as default start date
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('taskStartDate').value = today;
            
            // Add keyboard shortcuts
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && e.ctrlKey) {
                    addTask();
                }
                if (e.key === 'Escape') {
                    closeEditModal();
                }
            });
        });

        // Generate unique ID
        function generateId() {
            return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Add new task
        function addTask() {
            const title = document.getElementById('taskTitle').value.trim();
            const description = document.getElementById('taskDescription').value.trim();
            const startDate = document.getElementById('taskStartDate').value;
            const dueDate = document.getElementById('taskDueDate').value;
            const priority = document.getElementById('taskPriority').value;
            const status = document.getElementById('taskStatus').value;

            if (!title) {
                showNotification('Please enter a task title', 'error');
                return;
            }

            if (dueDate && startDate && new Date(dueDate) < new Date(startDate)) {
                showNotification('Due date cannot be earlier than start date', 'error');
                return;
            }

            const task = {
                id: generateId(),
                title,
                description,
                startDate,
                dueDate,
                priority,
                status,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            tasks.push(task);
            saveTasks();
            renderTasks();
            clearForm();
            showNotification('Task added successfully!', 'success');
            
            // Add success animation to button
            const btn = document.querySelector('.btn-primary');
            btn.classList.add('task-added');
            setTimeout(() => btn.classList.remove('task-added'), 600);
        }

        // Clear form inputs
        function clearForm() {
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDescription').value = '';
            document.getElementById('taskStartDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('taskDueDate').value = '';
            document.getElementById('taskPriority').value = 'medium';
            document.getElementById('taskStatus').value = 'pending';
        }

        // Render tasks
        function renderTasks() {
            const taskList = document.getElementById('taskList');
            const filteredTasks = filterTasksByStatus(tasks, currentFilter);

            if (filteredTasks.length === 0) {
                taskList.innerHTML = `
                    <div class="no-tasks">
                        <div style="font-size: 60px; margin-bottom: 20px;">📝</div>
                        <h3>${currentFilter === 'all' ? 'No tasks yet!' : `No ${currentFilter.replace('-', ' ')} tasks!`}</h3>
                        <p>${currentFilter === 'all' ? 'Add your first task to get started' : `Try switching to a different filter or add some ${currentFilter.replace('-', ' ')} tasks`}</p>
                    </div>
                `;
                return;
            }

            // Sort tasks by priority and due date
            filteredTasks.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                
                if (priorityDiff !== 0) return priorityDiff;
                
                if (a.dueDate && b.dueDate) {
                    return new Date(a.dueDate) - new Date(b.dueDate);
                }
                
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            taskList.innerHTML = filteredTasks.map(task => createTaskHTML(task)).join('');
        }

        // Create HTML for a single task
        function createTaskHTML(task) {
            const startDate = task.startDate ? formatDate(task.startDate) : 'Not set';
            const dueDate = task.dueDate ? formatDate(task.dueDate) : 'Not set';
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

            return `
                <div class="task-item priority-${task.priority} status-${task.status}" style="animation-delay: ${Math.random() * 0.3}s">
                    <div class="task-header">
                        <div>
                            <div class="task-title">${escapeHtml(task.title)}</div>
                            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                        </div>
                    </div>
                    <div class="task-meta">
                        <div class="task-dates">
                            <div class="date-item">
                                <span>📅 Start: ${startDate}</span>
                            </div>
                            <div class="date-item ${isOverdue ? 'text-danger' : ''}">
                                <span>🎯 Due: ${dueDate} ${isOverdue ? '(Overdue!)' : ''}</span>
                            </div>
                        </div>
                        <div class="task-badges">
                            <span class="badge priority-${task.priority}">${task.priority} Priority</span>
                            <span class="badge status-${task.status}">${task.status.replace('-', ' ')}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-edit" onclick="editTask('${task.id}')">Edit</button>
                        <button class="btn btn-delete" onclick="deleteTask('${task.id}')">Delete</button>
                    </div>
                </div>
            `;
        }

        // Format date for display
        function formatDate(dateString) {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('en-US', options);
        }

        // Escape HTML to prevent XSS
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Filter tasks by status
        function filterTasksByStatus(tasks, filter) {
            if (filter === 'all') return tasks;
            return tasks.filter(task => task.status === filter);
        }

        // Filter tasks
        function filterTasks(filter) {
            currentFilter = filter;
            
            // Update active filter button
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            renderTasks();
        }

        // Edit task
        function editTask(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            editingTaskId = taskId;
            
            // Populate edit form
            document.getElementById('editTaskTitle').value = task.title;
            document.getElementById('editTaskDescription').value = task.description || '';
            document.getElementById('editTaskStartDate').value = task.startDate || '';
            document.getElementById('editTaskDueDate').value = task.dueDate || '';
            document.getElementById('editTaskPriority').value = task.priority;
            document.getElementById('editTaskStatus').value = task.status;
            
            // Show modal
            document.getElementById('editModal').style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        // Update task
        function updateTask() {
            if (!editingTaskId) return;

            const title = document.getElementById('editTaskTitle').value.trim();
            const description = document.getElementById('editTaskDescription').value.trim();
            const startDate = document.getElementById('editTaskStartDate').value;
            const dueDate = document.getElementById('editTaskDueDate').value;
            const priority = document.getElementById('editTaskPriority').value;
            const status = document.getElementById('editTaskStatus').value;

            if (!title) {
                showNotification('Please enter a task title', 'error');
                return;
            }

            if (dueDate && startDate && new Date(dueDate) < new Date(startDate)) {
                showNotification('Due date cannot be earlier than start date', 'error');
                return;
            }

            const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
            if (taskIndex === -1) return;

            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title,
                description,
                startDate,
                dueDate,
                priority,
                status,
                updatedAt: new Date().toISOString()
            };

            saveTasks();
            renderTasks();
            closeEditModal();
            showNotification('Task updated successfully!', 'success');
        }

        // Delete task
        function deleteTask(taskId) {
            if (confirm('Are you sure you want to delete this task?')) {
                tasks = tasks.filter(t => t.id !== taskId);
                saveTasks();
                renderTasks();
                showNotification('Task deleted successfully!', 'success');
            }
        }

        // Close edit modal
        function closeEditModal() {
            document.getElementById('editModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            editingTaskId = null;
        }

        // Save tasks to memory (since localStorage is not available)
        function saveTasks() {
            // In a real application, this would save to localStorage or a database
            // For now, tasks are stored in memory during the session
        }

        // Load tasks from memory
        function loadTasks() {
            // In a real application, this would load from localStorage or a database
            // For now, we'll start with some sample tasks for demonstration
            if (tasks.length === 0) {
                tasks = [
                    {
                        id: 'sample_1',
                        title: 'Complete project proposal',
                        description: 'Write and submit the quarterly project proposal to management',
                        startDate: '2025-09-13',
                        dueDate: '2025-09-20',
                        priority: 'high',
                        status: 'in-progress',
                        createdAt: '2025-09-13T10:00:00.000Z',
                        updatedAt: '2025-09-13T10:00:00.000Z'
                    },
                    {
                        id: 'sample_2',
                        title: 'Team meeting preparation',
                        description: 'Prepare agenda and materials for weekly team meeting',
                        startDate: '2025-09-14',
                        dueDate: '2025-09-16',
                        priority: 'medium',
                        status: 'pending',
                        createdAt: '2025-09-13T11:00:00.000Z',
                        updatedAt: '2025-09-13T11:00:00.000Z'
                    },
                    {
                        id: 'sample_3',
                        title: 'Code review',
                        description: 'Review pull requests from team members',
                        startDate: '2025-09-12',
                        dueDate: '2025-09-15',
                        priority: 'low',
                        status: 'completed',
                        createdAt: '2025-09-12T09:00:00.000Z',
                        updatedAt: '2025-09-13T09:00:00.000Z'
                    }
                ];
            }
        }

        // Show notification
        function showNotification(message, type = 'info') {
            // Remove existing notifications
            const existingNotification = document.querySelector('.notification');
            if (existingNotification) {
                existingNotification.remove();
            }

            // Create notification element
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                    <span class="notification-message">${message}</span>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;

            // Add notification styles
            const style = document.createElement('style');
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    animation: slideInRight 0.4s ease-out;
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .notification-success {
                    background: linear-gradient(135deg, #2ed573 0%, #17c0eb 100%);
                    color: white;
                }

                .notification-error {
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                    color: white;
                }

                .notification-info {
                    background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
                    color: white;
                }

                .notification-content {
                    display: flex;
                    align-items: center;
                    padding: 15px 20px;
                    gap: 10px;
                }

                .notification-icon {
                    font-size: 20px;
                }

                .notification-message {
                    flex: 1;
                    font-weight: 600;
                }

                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    width: 25px;
                    height: 25px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .notification-close:hover {
                    background: rgba(255,255,255,0.2);
                }
            `;
            
            if (!document.querySelector('.notification-styles')) {
                style.className = 'notification-styles';
                document.head.appendChild(style);
            }

            // Add to page
            document.body.appendChild(notification);

            // Auto remove after 4 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.style.animation = 'slideOutRight 0.3s ease-in';
                    setTimeout(() => notification.remove(), 300);
                }
            }, 4000);
        }

        // Add slideOutRight animation
        const slideOutStyle = document.createElement('style');
        slideOutStyle.textContent = `
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100px);
                }
            }
        `;
        document.head.appendChild(slideOutStyle);

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('editModal');
            if (event.target === modal) {
                closeEditModal();
            }
        }

        // Add quick task feature with Enter key
        document.addEventListener('keydown', function(e) {
            const activeElement = document.activeElement;
            const isInputField = activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT' || activeElement.tagName === 'TEXTAREA';
            
            if (e.key === 'Enter' && isInputField && !e.shiftKey) {
                const titleInput = document.getElementById('taskTitle');
                if (activeElement === titleInput && titleInput.value.trim()) {
                    e.preventDefault();
                    addTask();
                }
            }
        });

        // Add drag and drop functionality for task reordering
        function makeTasksDraggable() {
            const taskItems = document.querySelectorAll('.task-item');
            taskItems.forEach(item => {
                item.draggable = true;
                item.addEventListener('dragstart', handleDragStart);
                item.addEventListener('dragover', handleDragOver);
                item.addEventListener('drop', handleDrop);
                item.addEventListener('dragend', handleDragEnd);
            });
        }

        let draggedElement = null;

        function handleDragStart(e) {
            draggedElement = this;
            this.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
        }

        function handleDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.dataTransfer.dropEffect = 'move';
            return false;
        }

        function handleDrop(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }

            if (draggedElement !== this) {
                const draggedTaskId = draggedElement.querySelector('.btn-edit').getAttribute('onclick').match(/'([^']+)'/)[1];
                const targetTaskId = this.querySelector('.btn-edit').getAttribute('onclick').match(/'([^']+)'/)[1];
                
                const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
                const targetIndex = tasks.findIndex(t => t.id === targetTaskId);
                
                if (draggedIndex !== -1 && targetIndex !== -1) {
                    const draggedTask = tasks.splice(draggedIndex, 1)[0];
                    tasks.splice(targetIndex, 0, draggedTask);
                    saveTasks();
                    renderTasks();
                }
            }

            return false;
        }

        function handleDragEnd(e) {
            this.style.opacity = '1';
            draggedElement = null;
        }

        // Update renderTasks to include drag and drop
        const originalRenderTasks = renderTasks;
        renderTasks = function() {
            originalRenderTasks();
            setTimeout(makeTasksDraggable, 100); // Allow DOM to update first
        };

        // Add task statistics
        function updateTaskStats() {
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === 'completed').length;
            const pendingTasks = tasks.filter(t => t.status === 'pending').length;
            const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
            const overdueTasks = tasks.filter(t => 
                t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
            ).length;

            // Update header with stats if needed
            const headerP = document.querySelector('.header p');
            headerP.innerHTML = `
                Stay organized and boost your productivity<br>
                <small style="opacity: 0.8; font-size: 0.9em;">
                    ${totalTasks} total • ${completedTasks} completed • ${pendingTasks} pending • ${inProgressTasks} in progress
                    ${overdueTasks > 0 ? ` • <span style="color: #ff6b6b;">${overdueTasks} overdue</span>` : ''}
                </small>
            `;
        }

        // Update the original renderTasks to include stats
        const originalRenderTasksWithStats = renderTasks;
        renderTasks = function() {
            originalRenderTasksWithStats();
            updateTaskStats();
            setTimeout(makeTasksDraggable, 100);
        };