async function handleCredentialResponse(res) {
    await fetch("/auth/v1/google", { //send the googleUser's id_token which has all the data we want to the server with a POST request
        method: "POST",
        body: JSON.stringify({
            token: res.credential
        }),
        headers: {
            "Content-Type": "application/json"
        }
    });
    window.location = "/";
}