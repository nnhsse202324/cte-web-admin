// !!! split into 2 files - courses.js and certficates.js

async function submit() {
  var courses = Array.from(document.querySelectorAll(".course_checkbox"));
  var courseNames = [];

  for (course of courses) {
    if (course.checked) {
      courseNames.push(course.id);
    }
  }

  const response = await fetch("/courses", {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(courseNames), // body data type must match "Content-Type" header
  });
  if (response.ok) {
    window.location = "/certificates";
  } else {
    console.log("error");
  }
}

async function submitCertificates() {
  var certificates = Array.from(
    document.querySelectorAll(".certificate_checkbox")
  );
  var certificateNames = [];

  for (certificate of certificates) {
    if (certificate.checked) {
      certificateNames.push(certificate.id);
    }
  }
}

/**
 * function downloadEmptyCSV() {
  const csvContent = "data:text/csv;charset=utf-8,\n";

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "empty_file.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

 */
