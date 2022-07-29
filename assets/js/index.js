async function submit(){
    var courses = Array.from(document.querySelectorAll(".course_checkbox"));
    var courseNames = [];

    for(course of courses)
    {
        if(course.checked) {
            courseNames.push(course.id)
        }
    }

    const response = await fetch("/courses", {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseNames) // body data type must match "Content-Type" header
    });
    if(response.ok) {
        window.location = "/certificates";
    }
    else {
        console.log("error");
    }
}

async function submitCertificates(){
    var certificates = Array.from(document.querySelectorAll(".certificate_checkbox"));
    var certificateNames = [];

    for(certificate of certificates)
    {
        if(certificate.checked) {
            certificateNames.push(certificate.id)
        }
    }

    const response = await fetch("/certificates", {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(certificateNames) // body data type must match "Content-Type" header
    });
    if(response.ok) {
        window.location = "/confirmation";
    }
    else {
        console.log("error");
    }
}