const express = require("express");
const route = express.Router();

const Student = require("../model/model");

const { OAuth2Client } = require("google-auth-library");
const CLIENT_ID =
  "665794489603-l8iltlfg1iqhni2883pp8tllvntc46vm.apps.googleusercontent.com";
const oAuth2 = new OAuth2Client(CLIENT_ID);

// load certificate data
const cteData = require("../model/cte");

route.get("/", (req, res) => {
  res.redirect("courses");
});

route.get("/courses", (req, res) => {
  res.render("courses", { student: req.student, cteData });
});

route.post("/courses", async (req, res) => {
  const courseNames = req.body;

  const courses = courseNames.map((course) => ({ name: course }));
  req.student.courses = courses;

  const earnedCertificates = [];

  for (const department of cteData.departments) {
    for (const certificate of department.certificates) {
      let semesterCount = 0;
      for (const course of certificate.courses) {
        if (req.student.courses.some((elem) => elem.name === course.name)) {
          semesterCount += course.semesters;
        }
      }

      if (semesterCount >= certificate.semesters) {
        earnedCertificates.push(certificate.name);
      }
    }
  }

  // if a student hasn't earned any certificates but has 4 or more semesters of courses,
  //  they qualify for the exploratory certificate
  if (earnedCertificates.length === 0) {
    let semesterCount = 0;
    for (const department of cteData.departments) {
      for (const certificate of department.certificates) {
        for (const course of certificate.courses) {
          if (req.student.courses.some((elem) => elem.name === course.name)) {
            semesterCount += course.semesters;
          }
        }
      }
    }

    if (semesterCount >= 4) {
      earnedCertificates.push("Exploratory");
    }
  }

  const certificates = earnedCertificates.map((certificate) => ({
    name: certificate,
    year: new Date().getFullYear(), // gets latest year
  }));

  // check if the student is no longer eligible for any of the certificates previous stored;
  //  this could happen if a student selected some classes and then went back and unselected some
  for (let i = 0; i < req.student.certificates.length; i++) {
    if (
      !earnedCertificates.includes(req.student.certificates[i].name) &&
      req.student.certificates[i].year === new Date().getFullYear()
    ) {
      console.log(
        "removing certificate: " +
          req.student.certificates[i].name +
          " from student: " +
          req.student.email
      );

      req.student.certificates.splice(i, 1);
      i--;
    }
  }

  // makes temp variable to save all certificate names
  const claimedCertificateNames = req.student.certificates.map((c) => c.name);

  // compares claimed certificate name to certificate you want to claim
  const uniqueCertificates = certificates.filter((certificate) => {
    return !claimedCertificateNames.includes(certificate.name);
  });

  // adds unique certificate list to certificates
  req.student.certificates =
    req.student.certificates.concat(uniqueCertificates);

  await req.student.save();

  res.status(201).end();
});

route.get("/certificateinfo", (req, res) => {
  res.render("certificateinfo");
});

route.get("/confirmation", async (req, res) => {
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
  // Function to calculate progress towards certificates
  const calculateProgressTowardsCertificates = () => {
    const progressTowardsCertificates = [];

    for (const department of cteData.departments) {
      for (const certificate of department.certificates) {
        let requiredSemesters = certificate.semesters;
        let semesterCount = 0;

        for (const course of certificate.courses) {
          if (
            req.student.courses.some(
              (selectedCourse) => selectedCourse.name === course.name
            )
          ) {
            semesterCount += course.semesters;
          }
        }

        if (semesterCount > 0 && semesterCount < requiredSemesters) {
          const remainingSemesters = requiredSemesters - semesterCount;
          const coursesNeeded = certificate.courses.filter(
            (course) =>
              !req.student.courses.some(
                (selectedCourse) => selectedCourse.name === course.name
              )
          );

          progressTowardsCertificates.push({
            certificate: certificate.name,
            semesterCount: semesterCount,
            remainingSemesters: remainingSemesters,
            coursesNeeded: coursesNeeded,
          });
        }
      }
    }

    return progressTowardsCertificates;
  };

  // Calculate progress towards certificates
  const progressTowardsCertificates = calculateProgressTowardsCertificates();

  res.render("confirmation", {
    student: req.student,
    progressTowardsCertificates: progressTowardsCertificates,
    selectedCoursesByCategory: selectedCoursesByCategory,
  });
});

route.get("/login", (req, res) => {
  res.render("login");
});

route.post("/auth/v1/google", async (req, res) => {
  const token = req.body.token;
  const ticket = await oAuth2.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  });

  const { sub, email, given_name, family_name } = ticket.getPayload();
  const student = await getOrMakeStudent(sub, email, given_name, family_name);
  req.session.student_sub = student.sub;
  res.status(201).end();
});

route.get("/logout", (req, res) => {
  delete req.session.student_sub;
  res.redirect("login");
});

async function getOrMakeStudent(sub, email, givenName, familyName) {
  let student = await Student.findOne({ sub: sub }); // see if a user exists with their google account
  if (!student) {
    // we are certain the user doesn't exist yet, let's make them from scratch
    student = new Student({
      sub,
      email,
      given_name: givenName,
      family_name: familyName,
      courses: [],
      certificates: [],
    });
    await student.save(); // insert the user into the collection
  }

  return student; // return the user (either newly made or updated)
}
route.get("/export", async (req, res) => {
  const data = await getStudentDataTabDelimited();
  const csvContent = "data:text/csv;charset=utf-8," + data;

  const encodedUri = encodeURI(csvContent);
  const emailLowerCase = req.student.email.toLowerCase();

  // Check if the email ends with "@naperville203.org" or matches specific emails
  if (
    emailLowerCase.endsWith("@naperville203.org") ||
    emailLowerCase === "cydai@stu.naperville203.org" ||
    emailLowerCase === "cryin@stu.naperville203.org" ||
    emailLowerCase === "ybu@stu.naperville203.org"
    // || emailLowerCase === "jyding@stu.naperville2WW03.org"
  ) {
    res.render("export", { encodedUri });
  } else {
    res.redirect("courses");
  }
});

route.get("/fixData", async (req, res) => {
  await updateCourseNameAndCertificates();
  res.redirect("courses");
});

async function getStudentDataTabDelimited() {
  try {
    const allStudents = await Student.find();

    let formattedData =
      "Email,Given Name,Family Name,Courses Taken,Certificates\n";

    allStudents.forEach((student, index) => {
      const coursesTaken = student.courses
        .map((course) => course.name)
        .join("; ");
      const certificates = student.certificates
        .map((certificate) => `${certificate.name} (${certificate.year})`)
        .join("; ");

      formattedData += `${student.email},${student.given_name},${student.family_name},${coursesTaken},${certificates}\n`;
    });

    return formattedData;
  } catch (error) {
    console.error("Error fetching the student data.", error);
    return ""; // Return an empty string in case of an error
  }
}

async function updateCourseNameAndCertificates() {
  const allStudents = await Student.find();

  for (let i = 0; i < allStudents.length; i++) {
    const student = allStudents[i];
    for (let j = 0; j < student.courses.length; j++) {
      if (student.courses[j].name === "Introdution to Business") {
        let duplicateCourse = false;
        for (let k = j; k < student.courses.length; k++) {
          if (student.courses[k].name === "Introduction to Business") {
            duplicateCourse = true;
          }
        }
        if (duplicateCourse) {
          student.courses.splice(j, 1);
        } else {
          student.courses[j].name = "Introduction to Business";
        }
        await student.save();
      }
    }

    const earnedCertificates = [];

    for (const department of cteData.departments) {
      for (const certificate of department.certificates) {
        let semesterCount = 0;
        for (const course of certificate.courses) {
          if (student.courses.some((elem) => elem.name === course.name)) {
            semesterCount += course.semesters;
          }
        }

        if (semesterCount >= certificate.semesters) {
          earnedCertificates.push(certificate.name);
        }
      }
    }

    // if a student hasn't earned any certificates but has 4 or more semesters of courses,
    //  they qualify for the exploratory certificate
    if (earnedCertificates.length === 0) {
      let semesterCount = 0;
      for (const department of cteData.departments) {
        for (const certificate of department.certificates) {
          for (const course of certificate.courses) {
            if (student.courses.some((elem) => elem.name === course.name)) {
              semesterCount += course.semesters;
            }
          }
        }
      }

      if (semesterCount >= 4) {
        earnedCertificates.push("Exploratory");
      }
    }

    if (earnedCertificates.length === 0) {
      student.certificates = earnedCertificates;
    } else {
      const certificates = earnedCertificates.map((certificate) => ({
        name: certificate,
        year: new Date().getFullYear(), // gets latest year
      }));

      // check if the student is no longer eligible for any of the certificates previous stored;
      //  this could happen if a student selected some classes and then went back and unselected some
      for (let i = 0; i < student.certificates.length; i++) {
        if (
          !earnedCertificates.includes(student.certificates[i].name) &&
          student.certificates[i].year === new Date().getFullYear()
        ) {
          console.log(
            "removing certificate: " +
              student.certificates[i].name +
              " from student: " +
              student.email
          );

          student.certificates.splice(i, 1);
          i--;
        }
      }

      // makes temp variable to save all certificate names
      const claimedCertificateNames = student.certificates.map((c) => c.name);

      // compares claimed certificate name to certificate you want to claim
      const uniqueCertificates = certificates.filter((certificate) => {
        return !claimedCertificateNames.includes(certificate.name);
      });

      // adds unique certificate list to certificates
      student.certificates = student.certificates.concat(uniqueCertificates);
    }
    await student.save();
  }
}

module.exports = route;
