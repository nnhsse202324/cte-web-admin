const express = require("express");
const route = express.Router();
const Student = require("../model/model");
const { OAuth2Client } = require("google-auth-library");
const CLIENT_ID =
  "665794489603-l8iltlfg1iqhni2883pp8tllvntc46vm.apps.googleusercontent.com";
const oAuth2 = new OAuth2Client(CLIENT_ID);
// Load certificate data
const cteData = require("../model/cte");

route.get("/", (req, res) => {
  res.redirect("courses");
});

route.get("/courses", (req, res) => {
  res.render("courses", { student: req.student, cteData: cteData });
});

route.post("/courses", async (req, res) => {
  var courseNames = req.body;
  console.log(courseNames);
  var courses = courseNames.map((course) => ({ name: course }));
  console.log(courses);
  req.student.courses = courses;
  await req.student.save();
  res.status(201).end();
});

route.get("/certificates", async (req, res) => {
  var earnedCertificates = [];

  console.log(req.student.courses);

  for (var department of cteData.departments) {
    for (var certificate of department.certificates) {
      var semesterCount = 0;
      for (var course of certificate.courses) {
        if (req.student.courses.some((elem) => elem.name === course.name)) {
          semesterCount += course.semesters;
        }
      }
      if (semesterCount >= certificate.semesters) {
        earnedCertificates.push(certificate);
      }
    }
  }

  // If a student hasn't earned any certificates but has 4 or more semesters of courses,
  // they qualify for the exploratory certificate
  if (earnedCertificates.length == 0) {
    var semesterCount = 0;
    for (var department of cteData.departments) {
      for (var certificate of department.certificates) {
        for (var course of certificate.courses) {
          if (req.student.courses.some((elem) => elem.name === course.name)) {
            semesterCount += course.semesters;
          }
        }
      }
    }
    if (semesterCount >= 4) {
      earnedCertificates.push({ name: "Exploratory" });
    }
  }

  // Update the student's certificates with the newly earned ones
  req.student.certificates = earnedCertificates;
  await req.student.save();

  if (earnedCertificates.length == 0) {
    // Logic to check if the student has progress towards certificates
    let hasProgress = false;
    for (const department of cteData.departments) {
      for (const certificate of department.certificates) {
        let semesterCount = 0;
        for (const course of certificate.courses) {
          if (
            req.student.courses.some(
              (elem) =>
                elem.name === course.name && elem.semesters >= course.semesters
            )
          ) {
            semesterCount += course.semesters;
          }
        }
        if (semesterCount > 0 && semesterCount < certificate.semesters) {
          hasProgress = true;
          break;
        }
      }
      if (hasProgress) break;
    }

    if (hasProgress) {
      res.render("certificates", {
        student: req.student,
        certificates: [],
      });
    } else {
      // If no progress towards certificates, render confirmation with empty progress array
      res.redirect("/confirmation");
    }
  } else {
    res.render("certificates", {
      student: req.student,
      certificates: earnedCertificates,
    });
  }
});

route.post("/certificates", async (req, res) => {
  var certificateNames = req.body;
  console.log(certificateNames);
  var certificates = certificateNames.map((certificate) => ({
    name: certificate,
    year: 2023,
  }));
  console.log(certificates);
  req.student.certificates = certificates;
  await req.student.save();
  res.status(201).end();
});

route.get("/confirmation", async (req, res) => {
  const hardcodedCourses = ["Course A", "Course B", "Course C"];
  const selectedCoursesByCategory = {};

  for (const department of cteData.departments) {
    for (const certificate of department.certificates) {
      const categoryName = certificate.name;
      const selectedCoursesWithSemesters = [];

      for (const course of certificate.courses) {
        const isSelected = req.student.courses.some((selectedCourse) => {
          return selectedCourse.name === course.name;
        });

        if (isSelected) {
          selectedCoursesWithSemesters.push({
            name: course.name,
            semesters: course.semesters,
          });
        }
      }

      selectedCoursesByCategory[categoryName] = selectedCoursesWithSemesters;
    }
  }

  const progressTowardsCertificates = [];

  for (const department of cteData.departments) {
    for (const certificate of department.certificates) {
      let requiredSemesters = certificate.semesters;
      let semesterCount = 0;

      for (const course of certificate.courses) {
        if (
          selectedCoursesByCategory[certificate.name].some(
            (c) => c.name === course.name
          )
        ) {
          semesterCount += course.semesters;
        }
      }

      if (semesterCount > 0 && semesterCount < requiredSemesters) {
        const remainingSemesters = requiredSemesters - semesterCount;
        const coursesNeeded = certificate.courses
          .filter(
            (course) =>
              !selectedCoursesByCategory[certificate.name].some(
                (c) => c.name === course.name
              )
          )
          .map((course) => ({
            name: course.name,
            semesters: course.semesters,
          }));

        progressTowardsCertificates.push({
          certificate: certificate.name,
          semesterCount: semesterCount,
          remainingSemesters: remainingSemesters,
          coursesNeeded: coursesNeeded,
        });
      }
    }
  }

  res.render("confirmation", {
    student: req.student,
    hardcodedCourses: hardcodedCourses,
    progressTowardsCertificates: progressTowardsCertificates,
    selectedCoursesByCategory: selectedCoursesByCategory, // Pass the selected courses grouped by category
  });
});

route.get("/login", (req, res) => {
  res.render("login");
});

route.post("/auth/v1/google", async (req, res) => {
  console.log(req.body);
  var token = req.body.token;
  let ticket = await oAuth2.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  });

  let { sub, email, given_name, family_name } = ticket.getPayload();
  console.log(sub, email, given_name, family_name);
  let student = await getOrMakeStudent(sub, email, given_name, family_name);
  console.log(student);
  req.session.student_sub = student.sub;
  res.status(201).end();
});

route.get("/logout", (req, res) => {
  delete req.session.student_sub;
  res.redirect("login");
});

async function getOrMakeStudent(sub, email, given_name, family_name) {
  var student = await Student.findOne({ sub: sub }); //see if a user exists with their google account
  if (!student) {
    //we are certain the user doesn't exist yet, let's make them from scratch
    student = new Student({
      sub: sub,
      email: email,
      given_name: given_name,
      family_name: family_name,
      courses: [],
      certificates: [],
    });
    await student.save(); // insert the user into the collection
  }

  return student; //return the user (either newly made or updated)
}

route.get("/export", (req, res) => {
  if (req.student.email.toLowerCase() !== "cydai@stu.naperville203.org") {
    res.render("export");
  } else {
    res.redirect("courses");
  }
});

async function printStudentData() {
  try {
    // Fetch all student data from the database
    const allStudents = await Student.find();

    console.log("All Students Data:");

    allStudents.forEach((student, index) => {
      console.log(`Student ${index + 1}:`);
      console.log("Sub:", student.sub);
      console.log("Email:", student.email);
      console.log("First Name:", student.given_name);
      console.log("Last Name:", student.family_name);
      console.log("Courses Taken:");
      student.courses.forEach((course, i) => {
        console.log(`  ${i + 1}. ${course.name}`);
      });
      console.log("Certificates:");
      student.certificates.forEach((certificate, i) => {
        console.log(`  ${i + 1}. ${certificate.name} (${certificate.year})`);
      });
      console.log("-----------------------------");
    });
  } catch (error) {
    console.error("Error fetching the student data.", error);
  }
}

async function printStudentDataTabDelimited() {
  try {
    // Fetch all student data from the database
    const allStudents = await Student.find();

    allStudents.forEach((student, index) => {
      let coursesTaken = student.courses
        .map((course) => course.name)
        .join(", ");
      let certificates = student.certificates
        .map((certificate) => `${certificate.name} (${certificate.year})`)
        .join(", ");

      console.log(
        `${student.sub}\t${student.email}\t${student.given_name}\t${student.family_name}\t${coursesTaken}\t${certificates}`
      );
    });
  } catch (error) {
    console.error("Error fetching the student data.", error);
  }
}

printStudentDataTabDelimited();
//printStudentData();

module.exports = route;
