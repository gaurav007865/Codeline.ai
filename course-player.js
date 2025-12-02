/* ================================================
   CONFIG
================================================ */
const scriptURL =
  "https://script.google.com/macros/s/AKfycby78u-pJ8Smigy76Wl44yTPACL5AO33VEqoqreVK39s6vTeH5u8Khud3xfO7qY2UcB2gw/exec";

const courseName = localStorage.getItem("watchCourse") || "Unknown Course";
document.getElementById("courseTitle").innerText = courseName;


/* ================================================
   TOGGLE PLAYLIST
================================================ */
function togglePlaylist() {
  document.getElementById("playlist").classList.toggle("open");
}


/* ================================================
   LOAD VIDEOS
================================================ */
async function loadCourseVideos() {
  try {
    const res = await fetch(`${scriptURL}?action=getVideos`);
    const videos = await res.json();

    const filtered = videos.filter(v => v.course === courseName);

    if (!filtered.length) {
      document.getElementById("playlist").innerHTML = "<p>No videos found.</p>";
      return;
    }

    document.getElementById("playlist").innerHTML = filtered.map(v => `
      <div class="playlist-card" onclick="playVideo('${v.id}', '${v.link}', '${v.title}', '${v.desc}')">
        <h4>${v.title}</h4>
        <p>${v.desc}</p>
      </div>
    `).join("");

    // Auto play first
    playVideo(filtered[0].id, filtered[0].link, filtered[0].title, filtered[0].desc);

  } catch (err) {
    document.getElementById("playlist").innerHTML = "<p>Error loading videos.</p>";
  }
}


/* ================================================
   PLAY VIDEO + Load Assignments
================================================ */
function playVideo(videoID, link, title, desc) {

  // Convert to embed
  if (link.includes("watch?v=")) link = link.replace("watch?v=", "embed/");
  if (link.includes("youtu.be")) link = link.replace("youtu.be/", "www.youtube.com/embed/");

  document.getElementById("playerFrame").src = link;
  document.getElementById("videoTitle").innerText = title;
  document.getElementById("videoDesc").innerText = desc;

  loadAssignments(videoID);
}


/* ================================================
   LOAD ASSIGNMENTS (FINAL FIXED)
================================================ */
async function loadAssignments(videoID) {
  const box = document.getElementById("assignmentList");
  box.innerHTML = "Loading assignments...";

  try {
    const res = await fetch(`${scriptURL}?action=getAssignments`);
    const data = await res.json();

    // If backend returned error
    if (!Array.isArray(data)) {
      console.error("Assignments error:", data);
      box.innerHTML = "<p>Error loading assignments.</p>";
      return;
    }

    // 🔥 CORRECT FILTER (based on your sheet column names)
    const filtered = data.filter(a =>
      a.VideoID.toString() === videoID.toString() &&
      a.CourseName === courseName
    );

    if (!filtered.length) {
      box.innerHTML = "<p>No assignments for this video.</p>";
      return;
    }

    box.innerHTML = filtered.map(a => `
      <div class="assignment-card">
        <div class="assignment-title">${a.Title}</div>
        <p class="assignment-desc">${a.Description}</p>

        ${a.ResourceLink ? `<a href="${a.ResourceLink}" class="resource-link" target="_blank">Open Resource</a>` : ""}

        <label class="upload-btn">
          Upload Answer:
          <input type="file" onchange="uploadAssignment('${a.AssignmentID}', '${courseName}', '${a.VideoID}', '${a.AssignmentNo}')">
        </label>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    box.innerHTML = "<p>Error loading assignments.</p>";
  }
}



/* ================================================
   UPLOAD ASSIGNMENT (FINAL WORKING)
================================================ */
async function uploadAssignment(assignmentId, courseName, videoId, assignmentNo) {
  const file = event.target.files[0];
  if (!file) return;

  alert("Uploading...");

  // Step 1: Upload file to Drive
  const uploadForm = new FormData();
  uploadForm.append("action", "uploadAssignmentFile");
  uploadForm.append("fileName", file.name);
  uploadForm.append("fileType", file.type);
  uploadForm.append("fileBytes", new Blob([file], { type: file.type }));

  const uploadRes = await fetch(scriptURL, { method: "POST", body: uploadForm });
  const uploadData = await uploadRes.json();

  if (!uploadData.url) {
    alert("File upload failed!");
    return;
  }

  // Step 2: Save details in DB
  const submitForm = new FormData();
  submitForm.append("action", "submitAssignment");
  submitForm.append("email", localStorage.getItem("email"));
  submitForm.append("course", courseName);
  submitForm.append("videoId", videoId);
  submitForm.append("assignmentNo", assignmentNo);
  submitForm.append("file", uploadData.url);

  const submitRes = await fetch(scriptURL, { method: "POST", body: submitForm });
  const submitData = await submitRes.json();

  if (submitData.status === "success") {
    alert("Assignment submitted!");
  } else {
    alert("Submit failed!");
  }
}


/* ================================================
   COMPILER
================================================ */
async function runCode() {
  const lang = document.getElementById("language").value;
  const code = document.getElementById("codeEditor").value;

  if (!code.trim()) {
    document.getElementById("outputBox").innerText = "⚠ Write code first";
    return;
  }

  document.getElementById("outputBox").innerText = "⏳ Running...";

  try {
    const res = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: lang,
        version: "latest",
        files: [{ content: code }]
      })
    });

    const data = await res.json();
    document.getElementById("outputBox").innerText = data.run.output;

  } catch (err) {
    document.getElementById("outputBox").innerText = "Error executing code";
  }
}


/* ================================================
   INIT
================================================ */
window.onload = () => {
  loadCourseVideos();
};
