// =========================================================
// 🌐 GOOGLE APPS SCRIPT BACKEND URL
// =========================================================
const scriptURL = "https://script.google.com/macros/s/AKfycbwkEUG9zs731jYlx1YuN4JTHvXjlJ0fTPpQkIPhhaz48Cs9OLDz9W6h4TSt9gh9mia4Cg/exec";


// =========================================================
// 🧾 REGISTER USER
// =========================================================
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !email || !password) {
    alert("⚠️ Please fill all fields!");
    return;
  }

  try {
    const res = await fetch(scriptURL, {
      method: "POST",
      body: new URLSearchParams({
        action: "register",
        name,
        email,
        password
      }),
    });

    const result = await res.json();
    console.log("Registration Response:", result);

    if (result.status === "success") {
      alert("✅ Registration successful!");
      window.location.href = "login.html";
    } else if (result.status === "exists") {
      alert("⚠️ Email already registered!");
    } else {
      alert("❌ Registration failed. Try again.");
    }

  } catch (err) {
    console.error("Registration Error:", err);
    alert("⚠️ Network error. Please try again!");
  }
});


// =========================================================
// 🔐 LOGIN USER (Admin / User)
// =========================================================
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("⚠️ Please fill all fields!");
    return;
  }

  try {
    const res = await fetch(scriptURL, {
      method: "POST",
      body: new URLSearchParams({
        action: "login",
        email,
        password
      }),
    });

    // ✅ Backend returns JSON like: { role: "User", name: "Gaurav", email: "..." }
    const data = await res.json();
    console.log("Login Response:", data);

    if (!data || data.role === "failed") {
      alert("❌ Invalid credentials. Try again!");
      return;
    }

    // Save login info
    // SAVE USER INFO  
localStorage.setItem("realUserName", data.name);
localStorage.setItem("email", data.email);
localStorage.setItem("role", data.role);

    // Redirect by role
    if (data.role === "Admin") {
      alert("✅ Welcome Admin!");
      window.location.href = "admin-dashboard.html";
    } else if (data.role === "User") {
      alert(`✅ Welcome ${data.name}!`);
      window.location.href = "user-dashboard.html";
    } else {
      alert("⚠️ Unknown role. Contact Support.");
    }

  } catch (err) {
    console.error("Login Error:", err);
    alert("⚠️ Network Error. Please check your connection!");
  }
});


// =========================================================
// 📢 LOAD ADS ON HOMEPAGE
// =========================================================
async function loadAds() {
  const adsContainer = document.getElementById("ads-container");
  if (!adsContainer) return;

  adsContainer.innerHTML = `<p>Loading ads...</p>`;

  try {
    const res = await fetch(`${scriptURL}?action=getAds`);
    const ads = await res.json();

    if (!ads || ads.length === 0) {
      adsContainer.innerHTML = `<p>No sponsored ads available right now.</p>`;
      return;
    }

    adsContainer.innerHTML = ads.map(
      (ad) => `
        <div class="ad-card">
          <img src="${ad.image || 'https://via.placeholder.com/250x150'}" alt="Ad Image" style="width:100%; border-radius:10px;">
          <h3>${ad.title}</h3>
          <p>${ad.desc}</p>
          <a href="${ad.link}" target="_blank" class="btn">View More</a>
        </div>`
    ).join("");
  } catch (err) {
    console.error("Error loading ads:", err);
    adsContainer.innerHTML = `<p style='color:red;'>Failed to load ads.</p>`;
  }
}
window.addEventListener("DOMContentLoaded", loadAds);


// =========================================================
// 🎓 LOAD COURSES FROM SHEET
// =========================================================
async function loadCourses() {
  const container = document.getElementById("courseContainer");
  if (!container) return;

  container.innerHTML = "<p>Loading courses...</p>";

  try {
    const res = await fetch(`${scriptURL}?action=getCourses`);
    const courses = await res.json();

    if (!courses || courses.length === 0) {
      container.innerHTML = "<p>No courses available right now.</p>";
      return;
    }

    container.innerHTML = courses.map(course => `
      <div class="course-card">
        <h3>${course.name}</h3>
        <p>${course.desc}</p>
        <p><strong>Price:</strong> ₹${course.price}</p>
        <p><strong>Duration:</strong> ${course.duration} Days</p>
        <button class="btn" onclick="buyCourse('${course.name}')">Buy Now</button>
      </div>
    `).join("");
  } catch (err) {
    console.error("Error loading courses:", err);
    container.innerHTML = "<p style='color:red;'>Failed to load courses.</p>";
  }
}
window.addEventListener("DOMContentLoaded", loadCourses);


// =========================================================
// 💳 BUY COURSE REQUEST
// =========================================================
function buyCourse(selectedCourse) {
  const email = localStorage.getItem("email");
  const name = localStorage.getItem("name");
  const role = localStorage.getItem("role");

  if (!email || !role) {
    alert("⚠️ Please login first to buy a course!");
    window.location.href = "login.html";
    return;
  }

  const confirmBuy = confirm(`Do you want to request this course: ${selectedCourse}?`);
  if (!confirmBuy) return;

  fetch(scriptURL, {
    method: "POST",
    body: new URLSearchParams({
      action: "addCourseRequest",
      name: name || email.split("@")[0],
      email,
      course: selectedCourse,
    }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        alert("✅ Your course request has been sent successfully!");
      } else {
        alert("❌ Something went wrong. Try again later.");
      }
    })
    .catch(err => {
      console.error("Error sending request:", err);
      alert("⚠️ Network error! Please try again later.");
    });
}
