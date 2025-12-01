/* ================================================
   CONFIG
================================================ */
const scriptURL =
  "https://script.google.com/macros/s/AKfycbyUvEqgWERUwesvtLlm6e2swDFwlx_m0I-GUCKSD_oI_Bq2GxjPxjm6twgxctBe8D5G/exec";

const courseName = localStorage.getItem("watchCourse");
document.getElementById("courseTitle").innerText = courseName;

/* =========================================================
   LOAD VIDEOS OF THIS COURSE
========================================================= */
async function loadCourseVideos() {
  try {
    const res = await fetch(`${scriptURL}?action=getVideos`);
    const videos = await res.json();

    // Filter videos only for selected course
    const filtered = videos.filter(v => v.course === courseName);

    if (!filtered.length) {
      document.getElementById("playlist").innerHTML =
        "<p>No videos uploaded for this course yet.</p>";
      return;
    }

    // Playlist load
    document.getElementById("playlist").innerHTML = filtered
      .map(
        (v, i) => `
        <div class="playlist-card"
             onclick="playVideo('${v.link}', '${v.title}', '${v.desc}')">
          
          <h4>${i + 1}. ${v.title}</h4>
          <p>${v.desc}</p>

        </div>
        `
      )
      .join("");

    // Auto play first video
    playVideo(filtered[0].link, filtered[0].title, filtered[0].desc);
  } catch (err) {
    console.error("Error Loading Videos → ", err);
  }
}

/* =========================================================
   ADVANCED YOUTUBE LINK CONVERTER + VIDEO PLAYER
========================================================= */
function playVideo(link, title, desc) {
  // Remove extra params
  if (link.includes("&")) link = link.split("&")[0];
  if (link.includes("?si=")) link = link.split("?si=")[0];

  // Case: youtu.be short link
  if (link.includes("youtu.be/")) {
    let id = link.split("youtu.be/")[1];
    link = "https://www.youtube.com/embed/" + id;
  }

  // Case: watch?v=
  else if (link.includes("watch?v=")) {
    let id = link.split("watch?v=")[1];
    link = "https://www.youtube.com/embed/" + id;
  }

  // Case: Shorts
  else if (link.includes("/shorts/")) {
    let id = link.split("/shorts/")[1];
    link = "https://www.youtube.com/embed/" + id;
  }

  // Case: Live
  else if (link.includes("/live/")) {
    let id = link.split("/live/")[1];
    link = "https://www.youtube.com/embed/" + id;
  }

  // Already embed (no change)
  else if (link.includes("/embed/")) {
    // nothing to change
  }

  // Unknown format fallback
  else {
    console.warn("⚠ Unknown YouTube format, loading raw:", link);
  }

  // Set video in player
  document.getElementById("playerFrame").src = link;
  document.getElementById("videoTitle").innerText = title;
  document.getElementById("videoDesc").innerText = desc;
}

/* =========================================================
   MOBILE PLAYLIST TOGGLE
========================================================= */
function togglePlaylist() {
  document.getElementById("playlist").classList.toggle("open");
}

/* =========================================================
   ON PAGE LOAD
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCourseVideos();
});
async function runCode() {
  const lang = document.getElementById("language").value;
  const code = document.getElementById("codeEditor").value;

  document.getElementById("outputBox").innerText = "Running...";

  const response = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: lang,
      version: "*",
      files: [{ content: code }]
    })
  });

  const result = await response.json();

  if (result.run) {
    document.getElementById("outputBox").innerText =
      result.run.stdout || result.run.stderr || "No output";
  } else {
    document.getElementById("outputBox").innerText = "Error running code.";
  }
}
