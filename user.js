/* =========================================================
   CONFIG + USER INFO
========================================================= */
const scriptURL = "https://script.google.com/macros/s/AKfycbxZx6aFD1rCCR8jtlUu4SjujiK7dgOkZr5WmT6Ug8lTD4vXZWNFcuuJ0LYJcc7JaHsKvA/exec";

let progressChartInstance = null;

const userEmail = localStorage.getItem("email");
const userName = localStorage.getItem("realUserName") || localStorage.getItem("name");
document.getElementById("userName").textContent = userName || "User";


/* =========================================================
   SECTION SWITCHING
========================================================= */
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
  const s = document.getElementById(id);
  if (s) s.style.display = "block";
}


/* =========================================================
   INITIAL LOAD
========================================================= */
window.addEventListener("DOMContentLoaded", () => {
  loadDashboardCounts();
  loadCourses();
  loadRequests();
  loadCertificates();
  loadPurchasedVideos();
  loadWatchClasses();
  loadProgress();
});


/* =========================================================
   1) DASHBOARD STATS
========================================================= */
async function loadDashboardCounts() {
  const courses = await (await fetch(`${scriptURL}?action=getCourses`)).json();
  const requests = await (await fetch(`${scriptURL}?action=getUserRequests&email=${userEmail}`)).json();
  const certs = await (await fetch(`${scriptURL}?action=getCertificates&email=${userEmail}`)).json();
  const purchased = await (await fetch(`${scriptURL}?action=getPurchasedCourses&email=${userEmail}`)).json();

  document.getElementById("countCourses").innerText = courses.length;
  document.getElementById("countRequests").innerText = requests.length;
  document.getElementById("countCertificates").innerText = certs.length;
  document.getElementById("countVideos").innerText = purchased.length;
}


/* =========================================================
   2) COURSES
========================================================= */
async function loadCourses() {
  const allCourses = await (await fetch(`${scriptURL}?action=getCourses`)).json();
  const purchased = await (await fetch(`${scriptURL}?action=getPurchasedCourses&email=${userEmail}`)).json();
  const requests = await (await fetch(`${scriptURL}?action=getUserRequests&email=${userEmail}`)).json();

  const purchasedNames = purchased.map(p => p.name);
  const requestedNames = requests.map(r => r.course);

  document.getElementById("allCourses").innerHTML = allCourses.map(c => {
    const isPurchased = purchasedNames.includes(c.name);
    const isRequested = requestedNames.includes(c.name);

    return `
      <div class="list-card">
        <h4>${c.name}</h4>
        <p>${c.desc}</p>
        <p><b>Price:</b> ₹${c.price}</p>

        ${
          isPurchased ? `<button class="btn purchased">Purchased ✔</button>` :
          isRequested ? `<button class="btn requested">Requested ⏳</button>` :
          `<button class="btn enroll" onclick="requestCourse('${c.name}')">Enroll Now</button>`
        }
      </div>
    `;
  }).join("");
}


/* =========================================================
   3) REQUEST COURSE
========================================================= */
async function requestCourse(courseName) {
  const requests = await (await fetch(`${scriptURL}?action=getUserRequests&email=${userEmail}`)).json();
  const purchased = await (await fetch(`${scriptURL}?action=getPurchasedCourses&email=${userEmail}`)).json();

  if (requests.some(r => r.course === courseName && r.status === "Pending")) {
    alert("You have already requested this course!");
    return;
  }

  if (purchased.some(p => p.name === courseName)) {
    alert("You already purchased this course!");
    return;
  }

  if (!confirm(`Enroll in ${courseName}?`)) return;

  const res = await fetch(scriptURL, {
    method: "POST",
    body: new URLSearchParams({
      action: "addCourseRequest",
      name: userName,
      email: userEmail,
      course: courseName
    })
  });

  const data = await res.json();

  if (data.status === "success") {
    alert("Course request submitted!");
    loadRequests();
    loadCourses();
  }
}


/* =========================================================
   4) MY REQUESTS
========================================================= */
async function loadRequests() {
  const data = await (await fetch(`${scriptURL}?action=getUserRequests&email=${userEmail}`)).json();

  document.getElementById("requestCourseCol").innerHTML = data.map(r => `
      <div class="box">
        <h4>${r.course}</h4>
        <p>Status: ${r.status}</p>
        <p>${new Date(r.date).toLocaleDateString()}</p>
      </div>
  `).join("");
}


/* =========================================================
   5) CERTIFICATES
========================================================= */
async function loadCertificates() {
  const certs = await (await fetch(`${scriptURL}?action=getCertificates&email=${userEmail}`)).json();

  document.getElementById("certificateSection").innerHTML = certs.map(c => `
      <div class="list-card">
        <h4>${c.course}</h4>
        <p>Status: ${c.status}</p>
      </div>
  `).join("");
}


/* =========================================================
   6) PURCHASED VIDEOS
========================================================= */
async function loadPurchasedVideos() {
  const purchased = await (await fetch(`${scriptURL}?action=getPurchasedCourses&email=${userEmail}`)).json();

  document.getElementById("videoList").innerHTML = purchased.map(c => `
    <div class="list-card">
      <h4>${c.name}</h4>
      <p>${c.desc}</p>
      <button class="btn enroll" onclick="openWatchPage('${c.name}')">▶️ Watch Course</button>
    </div>
  `).join("");
}

function openWatchPage(courseName){
  localStorage.setItem("watchCourse", courseName);
  window.location.href = "course-player.html";  
}


/* =========================================================
   7) PROGRESS CHART
========================================================= */
function loadProgress() {
  const ctx = document.getElementById("progressChart");

  if (progressChartInstance) {
    progressChartInstance.destroy();
  }

  progressChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Completed"],
      datasets: [{
        label: "Progress %",
        data: [80],
        backgroundColor: "#4ade80"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}


/* =========================================================
   8) WATCH CLASSES
========================================================= */
async function loadWatchClasses() {
  const purchased = await (await fetch(`${scriptURL}?action=getPurchasedCourses&email=${userEmail}`)).json();

  document.getElementById("watchCourseList").innerHTML = purchased.map(c => `
    <div class="watch-course-card" onclick="openWatchPage('${c.name}')">
      <h4>${c.name}</h4>
      <p>${c.desc}</p>
    </div>
  `).join("");
}


/* =========================================================
   LOGOUT
========================================================= */
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}


/* =========================================================
   WORKING COMPILER (JUDGE0)
========================================================= */

const JUDGE0_API = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";

const LANG_MAP = {
  javascript: 63,
  python: 71,
  cpp: 54,
  c: 50,
  java: 62,
  php: 68,
  go: 60
};

async function runCode() {

  const lang = document.getElementById("lang").value;
  const code = document.getElementById("code").value;
  const input = document.getElementById("input").value;

  if (!code.trim()) {
    document.getElementById("output").value = "Write some code first!";
    return;
  }

  document.getElementById("output").value = "⏳ Running your code...";

  const language_id = LANG_MAP[lang];

  try {
    const res = await fetch(JUDGE0_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language_id,
        source_code: code,
        stdin: input
      })
    });

    const data = await res.json();

    const output =
      data.stdout ||
      data.stderr ||
      data.compile_output ||
      "No output";

    document.getElementById("output").value = output;

  } catch (err) {
    document.getElementById("output").value =
      "❌ ERROR:\n" + err.message;
  }
}
