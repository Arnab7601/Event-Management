const eventForm = document.getElementById("event-form");
const adminSection = document.getElementById("admin");
const eventsList = document.getElementById("events-list");
const msgBox = document.getElementById("form-message");

const API_URL = "http://localhost:5000/events";
let events = [];

// Get token
function getToken() {
  return localStorage.getItem("token");
}

// Show/Hide form
function toggleAdminSection() {
  const token = getToken();
  if (adminSection) {
    adminSection.style.display = token ? "block" : "none";
  }
}

// Fetch all events
async function fetchEvents() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    events = data;
    displayEvents();
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    if (eventsList) eventsList.innerHTML = "<p>⚠️ Failed to load events.</p>";
  }
}

// Add new event
async function addEvent(event) {
  const token = getToken();
  if (!token) {
    msgBox.textContent = "⚠️ Please login to add events.";
    msgBox.style.color = "red";
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(event),
    });

    const data = await res.json();

    if (!res.ok) {
      msgBox.textContent = "❌ " + (data.message || "Failed to add event.");
      msgBox.style.color = "red";
      return;
    }

    // ✅ Push to list and refresh
    if (data.event) {
      events.push(data.event);
      displayEvents();
    }

    msgBox.textContent = "✅ Event added successfully!";
    msgBox.style.color = "green";
  } catch (err) {
    console.error("❌ Error adding event:", err);
    msgBox.textContent = "❌ Could not add event.";
    msgBox.style.color = "red";
  }
}

// Delete event
async function deleteEvent(id) {
  const token = getToken();
  if (!token) {
    alert("⚠️ You must be logged in to delete events.");
    return;
  }

  if (!confirm("⚠️ Are you sure you want to delete this event?")) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      alert("❌ " + (data.message || "Failed to delete event."));
      return;
    }

    events = events.filter(ev => ev._id !== id);
    displayEvents();
    alert("✅ Event deleted successfully!");
  } catch (err) {
    console.error("❌ Error deleting event:", err);
    alert("❌ Could not delete event.");
  }
}

// Display events
function displayEvents() {
  if (!eventsList) return;
  eventsList.innerHTML = "";

  if (events.length === 0) {
    eventsList.innerHTML = "<p>No upcoming events yet.</p>";
    return;
  }

  const token = getToken();

  events.forEach(event => {
    const eventCard = document.createElement("div");
    eventCard.classList.add("event-card");

    eventCard.innerHTML = `
      <h3>${event.title}</h3>
      <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
      <p>${event.description}</p>
      ${token && event.user ? `<button onclick="deleteEvent('${event._id}')" class="btn delete-btn">Delete</button>` : ""}
    `;

    eventsList.appendChild(eventCard);
  });
}

// Form submit
if (eventForm) {
  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("event-title").value.trim();
    const date = document.getElementById("event-date").value;
    const description = document.getElementById("event-description").value.trim();

    if (!title || !date || !description) {
      msgBox.textContent = "⚠️ Please fill in all fields!";
      msgBox.style.color = "red";
      return;
    }

    await addEvent({ title, date, description });
    eventForm.reset();
  });
}

// Init
fetchEvents();
toggleAdminSection();






