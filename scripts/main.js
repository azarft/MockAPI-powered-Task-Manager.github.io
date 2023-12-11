const apiUrl = "https://656cc60fe1e03bfd572ebb91.mockapi.io/api/azar";

document.addEventListener('DOMContentLoaded', async () => {
    // Assuming you want to start by displaying all tasks
    const defaultFilterType = 'all';

    // Call filterTasks with the default filter type
    await filterTasks(defaultFilterType);
});


let editingIndex = null;
let currentUser = null;

const loggedInUserId = localStorage.getItem('loggedInUserId');
const loggedInUserName = localStorage.getItem('loggedInUserName');
const userNameElement = document.getElementById('userName');
userNameElement.textContent = `Welcome, ${loggedInUserName}!`;

const successMessageElement = document.getElementById('successMessage');

// Add a property to track whether a task is completed
function Task(name, description, deadline, completed = false) {
    this.name = name;
    this.description = description;
    this.deadline = deadline;
    this.completed = completed;
}

async function saveTask() {
    const taskName = document.getElementById('taskNameInput').value;
    const taskDescription = document.getElementById('taskDescriptionInput').value;
    const taskDeadline = document.getElementById('taskDeadlineInput').value;

    if (taskName.trim() === '' || taskDescription.trim() === '' || taskDeadline.trim() === '') {
        alert('Please fill in all fields.');
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/user/${loggedInUserId}/tasks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                taskname: taskName,
                description: taskDescription,
                deadline: taskDeadline,
                userId: loggedInUserId,
            }),
        });

        if (response.ok) {
            // Clear input fields after saving
            resetInputFields();
            
            // Update the task list based on the selected filter
            filterTasks('all');
            selectFilterButton('all');
            
            // Display a success message for adding a new task
            displaySuccessMessage('Task saved successfully.', true);
        } else {
            const errorMessage = await response.text();
            console.error("Save task failed:", errorMessage);
            displaySuccessMessage(errorMessage, false);
        }
    } catch (error) {
        console.error("Error during save task:", error);
        displaySuccessMessage("An error occurred during save task.", false);
    }
}




async function filterTasks(filterType = 'all') {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; // Clear the existing task list

    try {
        const response = await fetch(`${apiUrl}/user/${loggedInUserId}/tasks`);
        const tasksResponse = await response.json();

        if (!Array.isArray(tasksResponse)) {
            console.error("Invalid tasks data:", tasksResponse);
            displaySuccessMessage("An error occurred while fetching tasks.", false);
            return;
        }

        tasks = tasksResponse;

        setFilterButtonStyle(`${filterType}TasksBtn`);

        tasks.forEach(task => {
            // Display tasks based on the selected filter
            if ((filterType === 'all') ||
                (filterType === 'completed' && task.isCompleted) ||
                (filterType === 'active' && !task.isCompleted)) {
                const newRow = taskList.insertRow();
                newRow.insertCell(0).innerText = task.taskname;
                newRow.insertCell(1).innerText = task.description;
                newRow.insertCell(2).innerText = task.deadline;
                newRow.insertCell(3).innerHTML = `<input type="checkbox" ${task.isCompleted ? 'checked' : ''} onclick="toggleCompletion(this)">`;
                newRow.insertCell(4).innerHTML = '<button onclick="editTask(this)">Edit</button> <button onclick="deleteTask(this)">Delete</button>';
            }
        });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        displaySuccessMessage("An error occurred while fetching tasks.", false);
    }

    setFilterButtonStyle(`${filterType}TasksBtn`);
}



async function toggleCompletion(checkbox) {
    const row = checkbox.parentNode.parentNode;
    const index = row.rowIndex - 1; // Adjust for header row

    try {
        // Update the isCompleted property in the database based on checkbox state
        const response = await fetch(`${apiUrl}/user/${loggedInUserId}/tasks/${tasks[index].task_id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                isCompleted: checkbox.checked,
            }),
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            console.error("Toggle completion failed:", errorMessage);
            displaySuccessMessage(errorMessage, false);
        }
    } catch (error) {
        console.error("Error during toggle completion:", error);
        displaySuccessMessage("An error occurred during toggle completion.", false);
    }

    // Update the task list based on the selected filter
    filterTasks('all');
    selectFilterButton('all');
}



async function editTask(button) {
    const row = button.parentNode.parentNode;
    const index = row.rowIndex - 1; // Adjust for header row

    // Populate the input fields with existing task values
    document.getElementById('taskNameInput').value = tasks[index].taskname;
    document.getElementById('taskDescriptionInput').value = tasks[index].description;
    document.getElementById('taskDeadlineInput').value = tasks[index].deadline;

    // Save the current task ID for later reference
    const currentTaskId = tasks[index].task_id;

    // Remove the row from the UI temporarily
    row.parentNode.removeChild(row);


    // Set the editingIndex to the index of the task being edited
    editingIndex = index;

    // Update the saveTask function to handle editing
    saveTask = async () => {
        const taskName = document.getElementById('taskNameInput').value;
        const taskDescription = document.getElementById('taskDescriptionInput').value;
        const taskDeadline = document.getElementById('taskDeadlineInput').value;

        if (taskName.trim() === '' || taskDescription.trim() === '' || taskDeadline.trim() === '') {
            alert('Please fill in all fields.');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/user/${loggedInUserId}/tasks/${currentTaskId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    taskname: taskName,
                    description: taskDescription,
                    deadline: taskDeadline,
                    completed: tasks[editingIndex].completed
                }),
            });

            if (response.ok) {
                displaySuccessMessage('Task edited successfully.', true);
            } else {
                const errorMessage = await response.text();
                console.error("Edit task failed:", errorMessage);
                displaySuccessMessage(errorMessage, false);
            }
        } catch (error) {
            console.error("Error during edit task:", error);
            displaySuccessMessage("An error occurred during edit task.", false);
        }

        // Reset the editingIndex after updating the task
        editingIndex = null;

        // Clear input fields after saving
        resetInputFields();

        // Update the task list based on the selected filter
        filterTasks('all');
        selectFilterButton('all');
    };

    // Change the onclick event for the Save Task button to use the updated saveTask function
    document.getElementById('saveTaskBtn').onclick = saveTask;

    // Display a message indicating that the user is in edit mode
    displaySuccessMessage('Editing task. Make changes and click "Save Task".', true);
}


async function deleteTask(button) {
    const row = button.parentNode.parentNode;
    const index = row.rowIndex - 1; // Adjust for header row

    try {
        const response = await fetch(`${apiUrl}/user/${loggedInUserId}/tasks/${tasks[index].task_id}`, {
            method: "DELETE",
        });

        if (response.ok) {
            displaySuccessMessage('Task deleted successfully.', true);
        } else {
            const errorMessage = await response.text();
            console.error("Delete task failed:", errorMessage);
            displaySuccessMessage(errorMessage, false);
        }
    } catch (error) {
        console.error("Error during delete task:", error);
        displaySuccessMessage("An error occurred during delete task.", false);
    }

    // Update the task list based on the selected filter
    filterTasks('all');
    selectFilterButton('all');
}

function setFilterButtonStyle(selectedButtonId) {
    const filterButtons = document.querySelectorAll('.filter-buttons button');
    filterButtons.forEach(button => {
        if (button.id === selectedButtonId) {
            button.classList.add('selected-filter');
        } else {
            button.classList.remove('selected-filter');
        }
    });
}

function displaySuccessMessage(message) {
    successMessageElement.textContent = message;
    successMessageElement.classList.add('success-message');
    setTimeout(() => {
      successMessageElement.textContent = '';
      successMessageElement.classList.remove('success-message');
    }, 3000); // Clear the message after 3 seconds
}

function resetInputFields() {
    document.getElementById('taskNameInput').value = '';
    document.getElementById('taskDescriptionInput').value = '';
    document.getElementById('taskDeadlineInput').value = '';
}

async function fetchAndUpdateTasks() {
    // Fetch the updated tasks from the server
    try {
        const response = await fetch(`${apiUrl}/user/${loggedInUserId}/tasks`);
        const tasksResponse = await response.json();

        if (!Array.isArray(tasksResponse)) {
            console.error("Invalid tasks data:", tasksResponse);
            displaySuccessMessage("An error occurred while fetching tasks.", false);
            return;
        }

        // Update the tasks array with the fetched tasks
        tasks = tasksResponse;

        // Update the task list in the UI
        const filterType = getSelectedFilter();
        filterTasks(filterType);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        displaySuccessMessage("An error occurred while fetching tasks.", false);
    }
}
function selectFilterButton(filterType) {
    const filterButton = document.getElementById(`${filterType}TasksBtn`);
    if (filterButton) {
        filterButton.checked = true;
    }
}
