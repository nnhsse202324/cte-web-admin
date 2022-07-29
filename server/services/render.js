var Student = require('../model/model');

const {OAuth2Client} = require('google-auth-library');

const axios = require('axios');

const CLIENT_ID = "1044226590904-o6i6sqk9j4lql9linthugs8bjt52cltl.apps.googleusercontent.com"
const oAuth2 = new OAuth2Client(CLIENT_ID);


// load certificate data
const certificates = require('../model/courses');


exports.homeRoutes = (req, res) => {

    res.render('index', {users: [], certificates: certificates});
    
    // Make a get request to /api/users
    // axios.get('http://localhost:3000/api/users')
    //     .then(function(response){
    //         res.render('index', { users : response.data });
    //     })
    //     .catch(err =>{
    //         res.send(err);
    //     })

    
}

exports.courses = async (req, res) => {

    var courseNames = req.body;

    console.log(courseNames);

    // !!! what is a better way to do this?
    var courses = [];
    for(var course of courseNames) {
        courses.push({name: course});
    }
    console.log(courses);
    req.student.courses = courses;
    await req.student.save();

    res.redirect('/certificates'); // !!! how to redirect to a new page?
}

exports.certificates = (req, res) => {

    var earnedCertificates = [];

    console.log(req.student.courses);

    for(var department of certificates.departments) {
        for(var certificate of department.certificates) {
            var semesterCount = 0;
            for(var course of certificate.courses) {
                if(req.student.courses.some(elem => elem.name === course.name)) {
                    semesterCount += course.semesters;
                }
            }

            if(semesterCount >= certificate.semesters) {
                earnedCertificates.push(certificate);
            }
        }
    }

    // !!! what are the rules for exploratory certificates?

    res.render('certificates', {users: [], certificates: earnedCertificates});
}

exports.saveCertificates = async (req, res) => {

    var certificateNames = req.body;

    console.log(certificateNames);

    // !!! what is a better way to do this?
    var certificates = [];
    for(var certificate of certificateNames) {
        certificates.push({name: certificate});
    }
    console.log(certificates);
    req.student.certificates = certificates;
    await req.student.save();

    res.redirect('/confirmation'); // !!! how to redirect to a new page?
}

exports.confirmation = (req, res) => {

    res.render('confirmation', {users: [], certificates: req.student.certificates});
}

exports.login = (req, res) => {

    res.render('login');   
}

exports.googleAuth = async (req, res) => {

    let token = req.body.token; // Gets token from request body
    let ticket = await oAuth2.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID
    });

    let {sub, email, given_name, family_name } = ticket.getPayload();
    console.log(sub, email, given_name, family_name);
    let student = await getOrMakeStudent(sub, email, given_name, family_name);
    console.log(student);
    req.session.student_sub = student.sub;
    res.status(201).end();
}

exports.add_user = (req, res) =>{
    res.render('add_user');
}

exports.update_user = (req, res) =>{
    axios.get('http://localhost:3000/api/users', { params : { id : req.query.id }})
        .then(function(userdata){
            res.render("update_user", { user : userdata.data})
        })
        .catch(err =>{
            res.send(err);
        })
}


async function getOrMakeStudent(sub, email, given_name, family_name) {
    var student = await Student.findOne({sub: sub}); //see if a user exists with their google account
    if (!student) { //we are certain the user doesn't exist yet, let's make them from scratch
        student = new Student({
            sub: sub,
            email: email,
            given_name: given_name,
            family_name: family_name,
            courses: [],
            certificates: []
        });
        await student.save(); // insert the user into the collection
    }
    
    return student; //return the user (either newly made or updated)
}
