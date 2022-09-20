$(document).ready(function () {

    $("#login").click(function () {
        $('.alert').remove();
        classSwitcher(1);
        var res = $("h2").text() == 'Sign In';
        if (res) {
            // alert("You are already on a Sign In page");
        } else {

            $(".form-container").fadeOut(function () {
                $("h2").text('Sign In');
                $("#main-sign-in-btn").text('Sign In');
                $(".form-container").fadeIn();
            });
        }
    });

    $("#signup").click(function () {
        $('.alert').remove();
        classSwitcher(2);

        var res = $("h2").text() == 'Sign Up';
        if (res) {

            // alert("You are already on a Sign Up page");
        } else {

            $(".form-container").fadeOut(function () {
                $("h2").text('Sign Up');
                $("#main-sign-in-btn").text('Sign Up');
                $(".form-container").fadeIn();
            });
        }
    });


    function classSwitcher(n) {
        if (n == 2) {
            $('#login').removeClass('activated');
            $('#signup').removeClass('not-activated');

            $('#login').addClass('not-activated');
            $('#signup').addClass('activated');

            $('form').removeAttr('id');
            $('form').attr('id', 'reg-form');

            $('#main-sign-in-btn').removeAttr('onclick');
            $('#main-sign-in-btn').attr('onclick', 'registerUser()');

            $('form').trigger("reset");



        } else if (n == 1) {

            $('#login').removeClass('not-activated');
            $('#signup').removeClass('activated');

            $('#login').addClass('activated');
            $('#signup').addClass('not-activated');

            $('form').removeAttr('id');
            $('form').attr('id', 'login');

            $('#main-sign-in-btn').removeAttr('onclick');
            $('#main-sign-in-btn').attr('onclick', 'login()');

            $('form').trigger("reset");

        }

    }

});