const form = document.getElementById("contactForm");
const statusText = document.getElementById("status");

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx2kAblkTtCgFAxMA7BR9MuqxeCALgerfuUM9f9iHjlkrOIG2bYsqnQfWiAvLPRTMkF/exec";

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    statusText.style.color = "blue";
    statusText.textContent = "Sending...";

    const formData = new FormData(form);

    try {
        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            statusText.style.color = "green";
            statusText.textContent = "Message sent successfully ✔";
            form.reset();
        } else {
            statusText.style.color = "red";
            statusText.textContent = "Failed to send message!";
        }

    } catch (error) {
        statusText.style.color = "red";
        statusText.textContent = "Error connecting to server!";
    }
});
