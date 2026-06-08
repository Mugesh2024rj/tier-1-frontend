// ============================================================
// Employee Management System - Frontend JavaScript
// Uses the native fetch() API to communicate with the backend
// ============================================================

// -----------------------------------------------------------
// CONFIGURATION
// Change this URL to point to your backend:
//   - Local development : http://localhost:8080
//   - Kubernetes        : http://<backend-service-ip>:8080
// -----------------------------------------------------------
const API_BASE_URL = "";

fetch("/employees")
// -----------------------------------------------------------
// DOM Element References
// Grabbed once at startup to avoid repeated lookups
// -----------------------------------------------------------
const employeeForm    = document.getElementById("employeeForm");
const formMessage     = document.getElementById("formMessage");
const spinner         = document.getElementById("spinner");
const tableContainer  = document.getElementById("tableContainer");
const employeeTableBody = document.getElementById("employeeTableBody");
const emptyMsg        = document.getElementById("emptyMsg");
const loadError       = document.getElementById("loadError");

// -----------------------------------------------------------
// FORM SUBMIT — Add New Employee
// Listens for the form submission, reads input values,
// and sends a POST request to the backend API.
// -----------------------------------------------------------
employeeForm.addEventListener("submit", async function (event) {
    // Prevent the browser from refreshing the page on form submit
    event.preventDefault();

    // Read values from the form fields
    const name       = document.getElementById("empName").value.trim();
    const department = document.getElementById("empDept").value.trim();
    const salary     = parseFloat(document.getElementById("empSalary").value);

    // Basic client-side validation
    if (!name || !department || isNaN(salary) || salary < 0) {
        showFormMessage("Please fill in all fields with valid values.", "error");
        return;
    }

    // Build the request body as a JavaScript object
    // JSON.stringify() converts it to a JSON string for the HTTP body
    const newEmployee = { name, department, salary };

    try {
        // Send POST request to the backend
        const response = await fetch("/employees", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"   // Tell backend we're sending JSON
            },
            body: JSON.stringify(newEmployee)         // Convert object → JSON string
        });

        // Check if the HTTP response status is 2xx (success)
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        // Parse the JSON response body
        const data = await response.json();

        // Show success message returned by the backend
        showFormMessage(data.message || "Employee Added Successfully", "success");

        // Clear the form fields after successful submission
        employeeForm.reset();

        // Automatically reload the employee list to show the new entry
        loadEmployees();

    } catch (err) {
        // Show error if fetch failed (e.g. backend is down)
        showFormMessage("Failed to add employee. Is the backend running?", "error");
        console.error("POST /employees error:", err);
    }
});

// -----------------------------------------------------------
// LOAD EMPLOYEES — Fetch and Display Employee List
// Sends a GET request to the backend and builds the HTML table.
// Called when the user clicks "Load Employees" or after an add.
// -----------------------------------------------------------
async function loadEmployees() {
    // Hide previous results and show the spinner
    hide(tableContainer);
    hide(emptyMsg);
    hide(loadError);
    show(spinner);

    try {
        // Send GET request to the backend
        const response = await fetch("/employees");

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        // Parse JSON array of employees
        const employees = await response.json();

        hide(spinner);

        if (employees.length === 0) {
            // No employees in the database yet
            show(emptyMsg);
            return;
        }

        // Build table rows from the employees array
        renderTable(employees);
        show(tableContainer);

    } catch (err) {
        hide(spinner);
        showLoadError("Failed to load employees. Is the backend running?");
        console.error("GET /employees error:", err);
    }
}

// -----------------------------------------------------------
// RENDER TABLE
// Takes an array of employee objects and creates <tr> rows
// for each one, then inserts them into the table body.
// -----------------------------------------------------------
function renderTable(employees) {
    // Clear any previously rendered rows
    employeeTableBody.innerHTML = "";

    // Loop through each employee object and create a table row
    employees.forEach(function (emp) {
        const row = document.createElement("tr");

        // Format salary with commas (e.g. 50000 → $50,000)
        const formattedSalary = "$" + Number(emp.salary).toLocaleString();

        row.innerHTML = `
            <td>${emp.id}</td>
            <td>${escapeHtml(emp.name)}</td>
            <td><span class="dept-badge">${escapeHtml(emp.department)}</span></td>
            <td>${formattedSalary}</td>
        `;

        employeeTableBody.appendChild(row);
    });
}

// -----------------------------------------------------------
// HELPER: Show Form Message (success or error)
// -----------------------------------------------------------
function showFormMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className   = `message ${type}`;  // applies .success or .error CSS class
    show(formMessage);

    // Auto-hide after 4 seconds
    setTimeout(() => hide(formMessage), 4000);
}

// -----------------------------------------------------------
// HELPER: Show Load Error Message
// -----------------------------------------------------------
function showLoadError(text) {
    loadError.textContent = text;
    loadError.className   = "message error";
    show(loadError);
}

// -----------------------------------------------------------
// HELPERS: Show / Hide elements using the .hidden CSS class
// -----------------------------------------------------------
function show(element) {
    element.classList.remove("hidden");
}

function hide(element) {
    element.classList.add("hidden");
}

// -----------------------------------------------------------
// HELPER: Escape HTML special characters to prevent XSS
// e.g. turns <script> into &lt;script&gt; before rendering
// -----------------------------------------------------------
function escapeHtml(text) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(String(text)));
    return div.innerHTML;
}
