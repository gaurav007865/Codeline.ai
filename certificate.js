// ----- Auto Fill Data -----
const name = localStorage.getItem("certName") || "Unknown User";
const course = localStorage.getItem("certCourse") || "Unknown Course";

document.getElementById("userName").innerText = name;
document.getElementById("courseName").innerText = course;
document.getElementById("issuedDate").innerText = new Date().toLocaleDateString();


// ----- PDF Download -----
async function downloadPDF() {
    const { jsPDF } = window.jspdf;

    const certificate = document.getElementById("certificate");

    const canvas = await html2canvas(certificate, { scale: 3 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("landscape", "pt", [900, 630]);
    pdf.addImage(imgData, "PNG", 0, 0, 900, 630);
    pdf.save(`${name}-certificate.pdf`);
}
