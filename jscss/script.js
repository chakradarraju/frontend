// Event Handlers

$("li a").click(function() {
    var lielement = $(this).parent();
    $(lielement).siblings().removeClass("active");
    $(lielement).addClass("active");
    navBarHandler($(this).attr("href").substr(1));
});

function feedSetup() {
    $("#tweetBox").focus(function() {
        $(this).prev().slideDown();
        $(this).next().slideDown();
    });
    $("#tweetBox").blur(function() {
        if($(this).val()=="") {
            $(this).prev().slideUp();
            $(this).next().slideUp();
        }
    });
    $("#clearBtn").click(function() {
        $("#tweetBox").fadeOut(function() {
            $("#tweetBox").val("");
            $("#tweetBox").focus();
            resizeIt();
            $("#tweetBox").fadeIn();
        });
    });
    $("#postBtn").click(function() {
        $("#ticker").html("Posting tweet...");
        $("#ticker").fadeIn();
        $.post("/backend/post/",{
            'postcontent':$("#tweetBox").val()
        }, function() {
            $("#ticker").fadeOut();
            $("#tweetBox").fadeOut(function() {
                $("#tweetBox").val("");
                resizeIt();
                $("#tweetBox").blur();
                $("#tweetBox").fadeIn();
            });
            updateFeed();
        });
    });
    $("#tweetBox").keydown(resizeIt);
}

// functions

function navBarHandler(href) {
    if(href=="feed") {
        updateFeed();
        showFeed();
        feedSetup();
    } else if(href=="myprofile") {
        updateProfile();
        showProfile();
    }
}
function resizeIt() {
    var str = $('#tweetBox').val();
    if(!str) str = "";
    $('#tweetBox').attr('rows',str.split("\n").length+1);
}
function updateFeed() {
    $.get('/backend/feed/',{},function(data) {
        var html = "";
        for(tweetid in data['tweets']) {
            var tweet = data['tweets'][tweetid];
            html += "<div class='tweet'>";
            html += "<span class='user'>"+tweet['sourceuser']+"</span><br/>";
            html += tweet['postcontent'];
            html += "</div>";
        }
        $("#tweetsContainer").html(html);
    }, "json");
}
function showFeed() {
    resizeIt();
    $("#content-wrapper").html($("#tmpl-feed").html());
}
function updateProfile() {
    $.get('/backend/myprofile/',{},function(data) {
        var html = "";

    });
}
function showProfile() {
    $("#content-wrapper").html($("#tmpl-profile").html());
}

// Bootup code

updateFeed();
showFeed();
feedSetup();
