const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const morgan = require('morgan');
const bodyparser = require("body-parser");
const path = require('path');

const connectDB = require('./server/database/connection');

const app = express();

var Student = require('./server/model/model');

dotenv.config( { path : '.env'} )
const PORT = process.env.PORT || 8080

// log requests
app.use(morgan('tiny'));

// mongodb connection
connectDB();

app.use(express.json());

app.use(session({
    secret: "oBz.N!FizP!DVhf7fRTgNnNcjNmzpgbKD",
    resave: true,
    saveUninitialized: true
})); // Allows use of req.session


// set view engine
app.set("view engine", "ejs")
//app.set("views", path.resolve(__dirname, "views/ejs"))


// load assets
app.use('/css', express.static(path.resolve(__dirname, "assets/css")))
app.use('/img', express.static(path.resolve(__dirname, "assets/img")))
app.use('/js', express.static(path.resolve(__dirname, "assets/js")))

//app.use takes a function that is added to the path of a request. When we call next() it goes to the next function in the path 
app.use(async (req, res, next) => {
    console.log(req.session.student_sub);
    if(req.session.student_sub) req.student = await Student.findOne({sub: req.session.student_sub}); //if there is a user id, set req.user to that user data object
    console.log(req.student);
    if (!(req.path.startsWith("/auth") || req.path.startsWith("/login")) && !req.student ) { //make sure that the user completes the auth flow, people without roles are bad and arent allowed to do anything
        res.redirect("/login");
        return;
    }
    next();
})

// load routers
app.use('/', require('./server/routes/router'))

app.listen(PORT, ()=> { console.log(`Server is running on http://localhost:${PORT}`)});