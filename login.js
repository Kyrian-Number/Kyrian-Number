// import * as d from "./data.js" // removed bc bs stuff who cares

function testAPI() {                      // Testing Graph API after login.  See statusChangeCallback() for when this call is made.
    console.log('Welcome!  Fetching your information.... ');
    FB.api(
        '/me',
        'GET',
        {"fields":"id,name,first_name,last_name,friends{hometown,short_name},hometown"},
        function(response) {
            console.log(response);
        }
    );
}

function checkLoginState() {               // Called when a person is finished with the Login Button.
    FB.getLoginStatus(function(response) {   // See the onlogin handler
        statusChangeCallback(response);
    });
}

function statusChangeCallback(response) {  // Called with the results from FB.getLoginStatus().
    console.log('statusChangeCallback');
    console.log(response);                   // The current login status of the person.
    if (response.status === 'connected') {   // Logged into your webpage and Facebook.
        testAPI();  
    } else {                                 // Not logged into your webpage or we are unable to tell.
    document.getElementById('status').innerHTML = 'Please log into this webpage.';
    }
}

window.fbAsyncInit = function() {
    FB.init({
    appId      : '201530738067216',
    xfbml      : true,
    version    : 'v11.0'
    });

    FB.AppEvents.logPageView();
    
    FB.getLoginStatus(function(response) {   // Called after the JS SDK has been initialized.
        statusChangeCallback(response);        // Returns the login status.
    });
};

(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

const test = () => {
    let u = document.getElementById("u").value;
    let f = document.getElementById("f").value;
    let data = { u, f };
    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    fetch('/index', options);
}
document.querySelector('button#test').addEventListener('click', test);