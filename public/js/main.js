const API_URL = "/api/items";
const form = document.getElementById("itemForm");
const tableBody = document.getElementById("itemsTable");
const submitButton = document.getElementById("submitBtn");
const cancelButton = document.getElementById("cancelBtn");
const emptyState = document.getElementById("emptyState");
const formTitle = document.getElementById("formTitle");
const listStatus = document.getElementById("listStatus");

let items = [];
let editingId = null;

async function request(url, options = {}) {
	const response = await fetch(url, options);
	const data = await response.json();
	if (!response.ok) throw new Error(data.error || "No se pudo completar la solicitud");
	return data;
}

function showStatus(message, isError = false) {
	listStatus.textContent = message;
	listStatus.dataset.error = String(isError);
}

function renderItems() {
	tableBody.replaceChildren();
	emptyState.hidden = items.length > 0;

	for (const item of items) {
		const row = document.createElement("tr");
		const idCell = document.createElement("td");
		const nameCell = document.createElement("td");
		const descriptionCell = document.createElement("td");
		const actionsCell = document.createElement("td");
		const actions = document.createElement("div");
		const editButton = document.createElement("button");
		const deleteButton = document.createElement("button");

		idCell.textContent = String(item.id).slice(-5);
		nameCell.textContent = item.name;
		descriptionCell.textContent = item.description || "Sin descripción";
		actions.className = "row-actions";
		editButton.type = "button";
		editButton.className = "row-action row-action-edit";
		editButton.dataset.action = "edit";
		editButton.dataset.id = item.id;
		editButton.textContent = "Editar";
		editButton.setAttribute("aria-label", `Editar ${item.name}`);
		deleteButton.type = "button";
		deleteButton.className = "row-action row-action-delete";
		deleteButton.dataset.action = "delete";
		deleteButton.dataset.id = item.id;
		deleteButton.textContent = "Eliminar";
		deleteButton.setAttribute("aria-label", `Eliminar ${item.name}`);

		actions.append(editButton, deleteButton);
		actionsCell.append(actions);
		row.append(idCell, nameCell, descriptionCell, actionsCell);
		tableBody.append(row);
	}

	showStatus("");
}

function resetForm() {
	form.reset();
	editingId = null;
	formTitle.textContent = "Agregar elemento";
	submitButton.textContent = "Agregar";
	cancelButton.hidden = true;
}

async function loadItems() {
	showStatus("Cargando elementos...");
	try {
		items = await request(API_URL);
		renderItems();
	} catch (error) {
		showStatus(error.message, true);
		emptyState.hidden = false;
		emptyState.textContent = "No se pudieron cargar los elementos.";
	}
}

form.addEventListener("submit", async event => {
	event.preventDefault();
	const values = {
		name: form.elements.name.value.trim(),
		description: form.elements.description.value.trim()
	};

	submitButton.disabled = true;
	try {
		const url = editingId === null ? API_URL : `${API_URL}/${editingId}`;
		await request(url, {
			method: editingId === null ? "POST" : "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(values)
		});
		resetForm();
		await loadItems();
	} catch (error) {
		showStatus(error.message, true);
	} finally {
		submitButton.disabled = false;
	}
});

tableBody.addEventListener("click", async event => {
	const button = event.target.closest("button[data-action]");
	if (!button) return;

	const id = Number(button.dataset.id);
	const item = items.find(entry => entry.id === id);
	if (!item) return;

	if (button.dataset.action === "edit") {
		editingId = id;
		form.elements.name.value = item.name;
		form.elements.description.value = item.description || "";
		formTitle.textContent = "Editar elemento";
		submitButton.textContent = "Guardar cambios";
		cancelButton.hidden = false;
		form.elements.name.focus();
		return;
	}

	if (!window.confirm(`¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`)) return;
	button.disabled = true;
	try {
		await request(`${API_URL}/${id}`, { method: "DELETE" });
		if (editingId === id) resetForm();
		await loadItems();
	} catch (error) {
		showStatus(error.message, true);
	} finally {
		button.disabled = false;
	}
});

cancelButton.addEventListener("click", resetForm);

loadItems();
