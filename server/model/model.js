const mongoose = require("mongoose");

// !!! rename to student.js

const schema = new mongoose.Schema({
  sub: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  given_name: {
    type: String,
    required: true,
  },
  family_name: {
    type: String,
    required: true,
  },
  courses: [{ name: String }],
  certificates: [{ name: String, year: Number }],
  certificateclaimed: [String], // Array of strings to store certificates claimed by the student
});

const Student = mongoose.model("student", schema);

module.exports = Student;
