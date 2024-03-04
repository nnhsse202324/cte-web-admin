const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");

const connectDB = require("./server/database/connection");

const app = express();

const Student = require("./server/model/model");

dotenv.config({ path: ".env" });
const PORT = process.env.PORT || 8081;

// log requests
app.use(morgan("tiny"));

// mongodb connection
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "oBz.N!FizP!DVhf7fRTgNnNcjNmzpgbKD", // !!! move to .env
    resave: true,
    saveUninitialized: true,
  })
);

// set view engine
app.set("view engine", "ejs");

// load assets
app.use("/css", express.static(path.resolve(__dirname, "assets/css")));
app.use("/img", express.static(path.resolve(__dirname, "assets/img")));
app.use("/js", express.static(path.resolve(__dirname, "assets/js")));

//app.use takes a function that is added to the path of a request. When we call next() it goes to the next function in the path
app.use(async (req, res, next) => {
  // if the student is already logged in, fetch the student object from the database
  if (req.session.student_sub) {
    req.student = await Student.findOne({ sub: req.session.student_sub });
  }

  // redirect the student to login unless they are already logged in
  if (
    !(req.path.startsWith("/auth") || req.path.startsWith("/login")) &&
    !req.student
  ) {
    res.redirect("/login");
    return;
  }
  next();
});

// load routers
app.use("/", require("./server/routes/router"));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
