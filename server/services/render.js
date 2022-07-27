const axios = require('axios');

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

exports.courses = (req, res) => {

    var courses = req.body;

    console.log(courses);

    res.render('index', {users: [], certificates: certificates});
    

    
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