console.log("Script is running");

document.addEventListener("DOMContentLoaded", function () {
  const darkModeToggle = document.getElementById("darkModeToggle");
  const body = document.body;

  darkModeToggle.addEventListener("click", function () {
    console.log("Button clicked!");
    body.classList.toggle("dark-mode");
    console.log("Dark mode toggled:", body.classList.contains("dark-mode")); // Check if the class is toggled
  });
});
