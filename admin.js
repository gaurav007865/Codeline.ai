const scriptURL = "https://script.google.com/macros/s/AKfycbyUvEqgWERUwesvtLlm6e2swDFwlx_m0I-GUCKSD_oI_Bq2GxjPxjm6twgxctBe8D5G/exec";

/* ---------------------------------------------------------
   ACCESS CONTROL
---------------------------------------------------------- */
const role = localStorage.getItem("role");
if (role !== "Admin") {
  alert("Access Denied! Admins only.");
  window.location.href = "login.html";
}

/* ---------------------------------------------------------
   LOGOUT
---------------------------------------------------------- */
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

/* ---------------------------------------------------------
   SIDEBAR NAVIGATION
---------------------------------------------------------- */
const sidebarItems = document.querySelectorAll(".sidebar-menu li");
const contentArea = document.getElementById("content-area");
const pageTitle = document.getElementById("page-title");

sidebarItems.forEach(item => {
  item.addEventListener("click", () => {
    sidebarItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    loadSection(item.dataset.section);
  });
});

/* ---------------------------------------------------------
   SECTION SWITCHER
---------------------------------------------------------- */
async function loadSection(section) {
  if (!section) return;

  switch (section) {
    case "overview": pageTitle.innerText = "Dashboard Overview"; loadDashboardOverview(); break;
    case "users": pageTitle.innerText = "All Registered Users"; loadUsers(); break;
    case "ads": pageTitle.innerText = "Manage Ads"; loadAdsForm(); break;
    case "courses": pageTitle.innerText = "Manage Courses"; loadCoursesForm(); break;
    case "requests": pageTitle.innerText = "Course Requests"; loadRequests(); break;
    case "videos": pageTitle.innerText = "Manage Videos"; loadVideosForm(); break;
    case "certReq":
      pageTitle.innerText = "Certificate Requests";
      loadCertificateRequests();
      break;
    default:
      loadDashboardOverview();
  }
}

/* ---------------------------------------------------------
   CERTIFICATE REQUEST MANAGEMENT (FINAL WORKING VERSION)
---------------------------------------------------------- */
async function loadCertificateRequests() {
  contentArea.innerHTML = `<h3>Certificate Requests</h3><div id="certReqTable">Loading...</div>`;

  try {
    const res = await fetch(`${scriptURL}?action=getCertificates&email=all`);
    let data = await res.json();

    // Only Requested certificates
    data = data.filter(c => c.status === "Requested");

    if (!data.length) {
      document.getElementById("certReqTable").innerHTML = "<p>No certificate requests.</p>";
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Course</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach(c => {
      html += `
        <tr>
          <td>${c.email}</td>
          <td>${c.course}</td>
          <td>${c.status}</td>
          <td>${c.date ? new Date(c.date).toLocaleDateString() : "-"}</td>
          <td>
            <button class="btn small" onclick="approveCert('${c.email}', '${c.course}')">Approve</button>
            <button class="btn small danger" onclick="rejectCert('${c.email}', '${c.course}')">Reject</button>
          </td>
        </tr>`;
    });

    html += "</tbody></table>";
    document.getElementById("certReqTable").innerHTML = html;

  } catch (err) {
    console.error(err);
  }
}

// APPROVE CERTIFICATE
async function approveCert(email, course) {
  const res = await fetch(scriptURL, {
    method: "POST",
    body: new URLSearchParams({
      action: "approveCertificate",
      email,
      course
    })
  });

  const data = await res.json();

  if (data.status === "approved") {
    alert("Certificate Approved Successfully!");
  } else {
    alert("Something went wrong!");
  }

  loadCertificateRequests();
}


// REJECT CERTIFICATE
async function rejectCert(email, course) {
  if (!confirm("Reject this certificate request?")) return;

  await fetch(scriptURL, {
    method: "POST",
    body: new URLSearchParams({
      action: "rejectCertificate",
      email,
      course
    })
  });

  alert("Request Rejected!");
  loadCertificateRequests();
}

/* ---------------------------------------------------------
   DASHBOARD OVERVIEW
---------------------------------------------------------- */
async function loadDashboardOverview() {
  contentArea.innerHTML = `
    <div class="overview-cards">
      <div class="card"><h3 id="userCount">0</h3><p>Users</p></div>
      <div class="card"><h3 id="courseCount">0</h3><p>Courses</p></div>
      <div class="card"><h3 id="reqCount">0</h3><p>Course Requests</p></div>
      <div class="card"><h3 id="adCount">0</h3><p>Ads</p></div>
      <div class="card"><h3 id="videoCount">0</h3><p>Videos</p></div>
    </div>`;

  try {
    const res = await fetch(`${scriptURL}?action=getStats`);
    const data = await res.json();

    document.getElementById("userCount").innerText = data.users;
    document.getElementById("courseCount").innerText = data.courses;
    document.getElementById("reqCount").innerText = data.requests;
    document.getElementById("adCount").innerText = data.ads;
    document.getElementById("videoCount").innerText = data.videos;

  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

/* ---------------------------------------------------------
   LOAD USERS
---------------------------------------------------------- */
async function loadUsers() {
  contentArea.innerHTML = `
    <h3>All Registered Users</h3>
    <div id="usersTable">Loading...</div>`;

  try {
    const res = await fetch(`${scriptURL}?action=getUsers`);
    const users = await res.json();

    if (!Array.isArray(users) || users.length === 0) {
      document.getElementById("usersTable").innerHTML = "<p>No users found.</p>";
      return;
    }

    let html = `
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr>
        </thead>
        <tbody>`;

    users.forEach(u => {
      html += `
        <tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>${u.role}</td>
          <td><span class="status ${u.status.toLowerCase()}">${u.status}</span></td>
          <td>${new Date(u.date).toLocaleDateString()}</td>
        </tr>`;
    });

    html += "</tbody></table>";
    document.getElementById("usersTable").innerHTML = html;

  } catch (err) {
    console.error("Error loading users:", err);
  }
}

/* ---------------------------------------------------------
   ADS MANAGEMENT
---------------------------------------------------------- */
function loadAdsForm() {
  contentArea.innerHTML = `
    <form id="adForm" class="admin-form">
      <h3>Add New Ad</h3>
      <input type="text" id="adTitle" placeholder="Ad Title" required>
      <input type="text" id="adDesc" placeholder="Description" required>
      <input type="text" id="adImage" placeholder="Image URL">
      <input type="text" id="adLink" placeholder="Redirect URL">
      <button class="btn">Add Ad</button>
    </form>`;

  document.getElementById("adForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      action: "addAd",
      title: adTitle.value.trim(),
      description: adDesc.value.trim(),
      image: adImage.value.trim(),
      link: adLink.value.trim()
    };

    await fetch(scriptURL, { method: "POST", body: new URLSearchParams(data) });

    alert("Ad Added Successfully!");
    e.target.reset();
  });
}

/* ---------------------------------------------------------
   COURSES MANAGEMENT
---------------------------------------------------------- */
function loadCoursesForm() {
  contentArea.innerHTML = `
    <form id="courseForm" class="admin-form">
      <h3>Add New Course</h3>
      <input type="text" id="courseName" placeholder="Course Name" required>
      <textarea id="courseDesc" placeholder="Description" required></textarea>
      <input type="number" id="coursePrice" placeholder="Price" required>
      <input type="number" id="courseDuration" placeholder="Duration (Days)" required>
      <button class="btn">Add Course</button>
    </form>`;

  document.getElementById("courseForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      action: "addCourse",
      name: courseName.value.trim(),
      desc: courseDesc.value.trim(),
      price: coursePrice.value.trim(),
      duration: courseDuration.value.trim()
    };

    await fetch(scriptURL, { method: "POST", body: new URLSearchParams(data) });

    alert("Course Added Successfully!");
    e.target.reset();
  });
}

/* ---------------------------------------------------------
   COURSE REQUESTS
---------------------------------------------------------- */
async function loadRequests() {
  contentArea.innerHTML = `
    <h3>Course Requests</h3>
    <div id="requestsTable">Loading...</div>`;

  try {
    const res = await fetch(`${scriptURL}?action=getRequests`);
    let requests = await res.json();

    requests = requests.filter(r => r.status === "Pending");

    if (requests.length === 0) {
      document.getElementById("requestsTable").innerHTML = "<p>No pending requests.</p>";
      return;
    }

    let html = `
      <table>
        <thead>
          <tr><th>ID</th><th>Name</th><th>Email</th><th>Course</th><th>Date</th><th>Action</th></tr>
        </thead>
        <tbody>`;

    requests.forEach(r => {
      html += `
        <tr>
          <td>${r.id}</td>
          <td>${r.name}</td>
          <td>${r.email}</td>
          <td>${r.course}</td>
          <td>${new Date(r.date).toLocaleDateString()}</td>
          <td>
            <button class="btn small" onclick="updateStatus('${r.id}', 'Approved')">Approve</button>
            <button class="btn small danger" onclick="updateStatus('${r.id}', 'Rejected')">Reject</button>
          </td>
        </tr>`;
    });

    html += "</tbody></table>";
    document.getElementById("requestsTable").innerHTML = html;

  } catch (err) {
    console.error(err);
  }
}

async function updateStatus(id, status) {
  await fetch(scriptURL, {
    method: "POST",
    body: new URLSearchParams({ action: "updateRequestStatus", id, status })
  });

  alert(`Request ${status}!`);
  loadRequests();
}

/* ---------------------------------------------------------
   VIDEO MANAGEMENT
---------------------------------------------------------- */
function loadVideosForm() {
  contentArea.innerHTML = `
    <form id="videoForm" class="admin-form">
      <h3>Add New Video</h3>
      <input type="text" id="videoCourse" placeholder="Course Name" required>
      <input type="text" id="videoTitle" placeholder="Video Title" required>
      <input type="text" id="videoDesc" placeholder="Description" required>
      <input type="text" id="videoLink" placeholder="Video Link" required>
      <button class="btn">Add Video</button>
    </form>`;

  document.getElementById("videoForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      action: "addVideo",
      course: videoCourse.value.trim(),
      title: videoTitle.value.trim(),
      desc: videoDesc.value.trim(),
      link: videoLink.value.trim()
    };

    await fetch(scriptURL, { method: "POST", body: new URLSearchParams(data) });

    alert("Video Added Successfully!");
    e.target.reset();
  });
}

/* ---------------------------------------------------------
   DEFAULT LOAD
---------------------------------------------------------- */
window.addEventListener("DOMContentLoaded", () => loadSection("overview"));
