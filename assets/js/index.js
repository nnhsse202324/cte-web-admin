


$("#add_user").submit(function(event){
    alert("Data Inserted Successfully!");
})

$("#update_user").submit(function(event){
    event.preventDefault();

    var unindexed_array = $(this).serializeArray();
    var data = {}

    $.map(unindexed_array, function(n, i){
        data[n['name']] = n['value']
    })


    var request = {
        "url" : `http://localhost:3000/api/users/${data.id}`,
        "method" : "PUT",
        "data" : data
    }

    $.ajax(request).done(function(response){
        alert("Data Updated Successfully!");
    })

})

if(window.location.pathname == "/"){
    $ondelete = $(".table tbody td a.delete");
    $ondelete.click(function(){
        var id = $(this).attr("data-id")

        var request = {
            "url" : `http://localhost:3000/api/users/${id}`,
            "method" : "DELETE"
        }

        if(confirm("Do you really want to delete this record?")){
            $.ajax(request).done(function(response){
                alert("Data Deleted Successfully!");
                location.reload();
            })
        }

    })
}

async function submit(){
    var courses = Array.from(document.querySelectorAll(".course"));
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
    var res = await response.json(); // parses JSON response into native JavaScript objects
    window.location = "/certificates";  // !!! how to redirect to a new page?
}

async function submitCertificates(){
    var certificates = Array.from(document.querySelectorAll(".certificate"));
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
    var res = await response.json(); // parses JSON response into native JavaScript objects
    window.location = "/confirmation";  // !!! how to redirect to a new page?
}