async function submit() {
  const courses = Array.from(document.querySelectorAll(".course_checkbox"));
  const courseNames = [];

  for (const course of courses) {
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
    window.location = "/confirmation";
  } else {
    console.log("error");
  }
}
