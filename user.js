/* =========================================================
   CONFIG + USER INFO
========================================================= */
const scriptURL = "https://script.google.com/macros/s/AKfycbyUvEqgWERUwesvtLlm6e2swDFwlx_m0I-GUCKSD_oI_Bq2GxjPxjm6twgxctBe8D5G/exec";

let progressChartInstance = null;

const userEmail = localStorage.getItem("email");
const userName = localStorage.getItem("realUserName") || localStorage.getItem("name");
document.getElementById("userName").textContent = userName;


/* =========================================================
   SECTION SWITCHING
========================================================= */
function showSection(id) {
  console.log("Switch →", id);  // <-- CHECK IF CALLED

  document.querySelectorAll(".section")
    .forEach(sec => {
      sec.style.display = "none";
    });

  const s = document.getElementById(id);
  if (!s) {
    console.error("Section NOT FOUND →", id);
    return;
  }

  s.style.display = "block";
}



/* =========================================================
   INITIAL DATA LOAD
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
   1) DASHBOARD COUNTS
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
   2) COURSES (Enroll / Requested / Purchased)
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
          isPurchased
            ? `<button class="btn purchased">Purchased ✔</button>`
            : isRequested
              ? `<button class="btn requested">Requested ⏳</button>`
              : `<button class="btn enroll" onclick="requestCourse('${c.name}')">Enroll Now</button>`
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

  document.getElementById("requestCourseCol").innerHTML =
    data.map(r => `
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

  const unique = [];
  const added = new Set();

  certs.forEach(c => {
    if (!added.has(c.course)) {
      added.add(c.course);
      unique.push(c);
    }
  });

  document.getElementById("certificateSection").innerHTML =
    unique.map(c => {

      if (c.status === "Approved") {
        return `
          <div class="list-card">
            <h4>${c.course}</h4>
            <p>Status: <span class="cert-badge cert-approved">Approved</span></p>
            <button class="btn enroll" onclick="openCertificate('${c.course}')">View Certificate</button>
          </div>
        `;
      }

      if (c.status === "Rejected") {
        return `
          <div class="list-card">
            <h4>${c.course}</h4>
            <p>Status: <span class="cert-badge cert-rejected">Rejected</span></p>
          </div>
        `;
      }

      return `
        <div class="list-card">
          <h4>${c.course}</h4>
          <p>Status: <span class="cert-badge cert-requested">Requested</span></p>
        </div>
      `;
    }).join("");
}


// Certificate viewer
function openCertificate(courseName) {
  localStorage.setItem("certificateCourse", courseName);
  window.location.href = "certificate.html";
}



/* =========================================================
   6) PURCHASED CLASSES (My Classes)
========================================================= */
async function loadPurchasedVideos() {
  const purchased = await (await fetch(`${scriptURL}?action=getPurchasedCourses&email=${userEmail}`)).json();

  const unique = [];
  const set = new Set();

  purchased.forEach(c => {
    if (!set.has(c.name)) {
      set.add(c.name);
      unique.push(c);
    }
  });

  document.getElementById("videoList").innerHTML = unique.map(c => `
    <div class="list-card">
      <h4>${c.name}</h4>
      <p>${c.desc}</p>
      <button class="btn enroll" onclick="openWatchPage('${c.name}')">▶️ Watch Course</button>
    </div>
  `).join("");
}



/* =========================================================
   7) PROGRESS CHART
========================================================= */
function loadProgress() {
  const ctx = document.getElementById("progressChart");

  if (progressChartInstance !== null) {
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
   8) WATCH CLASSES — Course List
========================================================= */
async function loadWatchClasses() {
  const purchased = await (await fetch(`${scriptURL}?action=getPurchasedCourses&email=${userEmail}`)).json();

  document.getElementById("watchCourseList").innerHTML =
    purchased.map(c => `
      <div class="watch-course-card" onclick="openWatchPage('${c.name}')">
        <h4>${c.name}</h4>
        <p>${c.desc}</p>
      </div>
    `).join("");
}



/* =========================================================
   WATCH COURSE PAGE
========================================================= */
function openWatchPage(courseName) {
  localStorage.setItem("watchCourse", courseName);
  showSection("watchPlayer");
  loadWatchPageVideos();
}



/* =========================================================
   PLAYLIST + PLAYER
========================================================= */
async function loadWatchPageVideos() {

  const courseName = localStorage.getItem("watchCourse");

  const videos = await (await fetch(`${scriptURL}?action=getVideos`)).json();

  const filtered = videos.filter(v => v.course === courseName);

  if (filtered.length === 0) {
    document.getElementById("playerPlaylist").innerHTML = "<p>No videos found.</p>";
    return;
  }

  document.getElementById("playerPlaylist").innerHTML =
    filtered.map(v => `
      <div class="playlist-card" onclick="playVideo('${v.link}','${v.title}','${v.desc}')">
        <h4>${v.title}</h4>
        <p>${v.desc}</p>
      </div>
    `).join("");

  playVideo(filtered[0].link, filtered[0].title, filtered[0].desc);
}

function playVideo(link, title, desc) {

  if (link.includes("watch?v=")) {
    link = link.replace("watch?v=", "embed/");
  }

  if (link.includes("youtu.be")) {
    link = link.replace("youtu.be/", "www.youtube.com/embed/");
  }

  document.getElementById("playerFrame").src = link;
  document.getElementById("playerTitle").innerText = title;
  document.getElementById("playerDesc").innerText = desc;
}



/* =========================================================
   LOGOUT
========================================================= */
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
