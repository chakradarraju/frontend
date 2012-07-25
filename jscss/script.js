// Event Handlers

$("li a").click(function() {
    var tab = $(this).attr("href").substr(1);
    showTab(tab);
    navBarHandler(tab);
});
$("#logoutButton").click(function() {
    $.post('/backend/logout/',{}, function(data) {
        if(data['message']=="Successfully logged out")
            window.location = "/frontend/login.html";
    },"json");
});
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
    showTicker("Posting tweet...");
    $.post("/backend/post/",{
        'postcontent':$("#tweetBox").val()
    }, function() {
        hideTicker();
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
setInterval(refreshTimes, 10000);

// functions

function showTicker(text) {
    $("#ticker").html(text);
    $("#ticker").fadeIn();
}
function hideTicker(text) {
    $("#ticker").fadeOut();
}
function refreshTimes() {
    $(".active .timestamp").each(function() {
        var dur = new Date() - new Date(parseInt($(this).attr('ref')));
        $(this).html(timeDiff(dur)+" ago");
    });
}
function showTab(tab) {
    $(".sector").removeClass("active");
    $("#tab-"+tab).addClass("active");
    $(".menuitem").removeClass("active");
    $("#menu-"+tab).addClass("active");
}
function navBarHandler(href) {
    if(href=="feed") {
        updateFeed();
    } else if(href=="profile") {
        updateProfile();
    }
}
function resizeIt() {
    var str = $('#tweetBox').val();
    if(!str) str = "";
    $('#tweetBox').attr('rows',str.split("\n").length+1);
}
function something(a) {
    alert(a);
    return timeDiff(new Date()-new Date(a.attr('href')));
}
function timeDiff(dur) {
    dur = Math.ceil(dur/1000);
    if(dur<60) return dur + " sec";
    dur = Math.ceil(dur/60);
    if(dur<60) return dur + " min";
    dur = Math.ceil(dur/60);
    if(dur<24) return dur + " hrs";
    dur = Math.ceil(dur/24);
    return dur + " days";
}
function updateFeed() {
    showTicker("Updating Feed...");
    $.get('/backend/feed/',{},function(data) {
        if(data['display']=="login")
            window.location = "/frontend/login.html";
        for(tweetid in data['tweets']) {
            var tweet = data['tweets'][tweetid];
            if(!document.getElementById("feed-"+tweet['postid'])) {
                tweet['sourceuser'] = JSON.parse(tweet['sourceuser']);
                $("#feedContainer").prepend(_.template($("#tmpl-tweet").html(),{
                    username: tweet['sourceuser']['username'],
                    userid: tweet['sourceuser']['userid'],
                    timestamp: tweet['timestamp'],
                    tweet: tweet['postcontent'],
                    tweetid: "feed-"+tweet['postid']
                }));
                $("#feedContainer :hidden").slideDown();
            }
        }
        refreshTimes();
        hideTicker();
    }, "json");
}

function updateProfile(userid) {
    showTicker("Loading Profile...");
    if(arguments.length==0) url = '/backend/myprofile/';
    else url = '/backend/profile/'+userid;
    $.get(url,{},function(data) {
        if(data['display']=="login")
            window.location = "/frontend/login.html";
        userid = data['userid'];
        if(userid!=profileUserId) {
            $("#tweetContainer").html("");
            profileUserId = userid;
        }
        $("#profile-emailid").html(data['emailid']);
        $("#profile-username").html(data['username']);
        data['followerslist'] = JSON.parse(data['followerslist']);
        data['followinglist'] = JSON.parse(data['followinglist']);
        $("#profile-followers-count").html(data['followerslist'].length);
        $("#profile-following-count").html(data['followinglist'].length);
        for(tweetid in data['tweets']) {
            var tweet = data['tweets'][tweetid];
            if(!document.getElementById("tweet-"+tweet['postid'])) {
                $("#tweetContainer").prepend(_.template($("#tmpl-tweet").html(),{
                    username: data['username'],
                    userid: data['userid'],
                    timestamp: tweet['timestamp'],
                    tweet: tweet['postcontent'],
                    tweetid: "tweet-"+tweet['postid']
                }));
                $("#tweetContainer :hidden").slideDown();
            }
        }
        refreshTimes();
        $("#followButton").click(function() {
            $.get('/backend/follow/'+userid,{},function(data) {
                alert(data['message']);
            }, "json");
        });
        hideTicker();
    },"json");
}

// Data

var profileUserId = null;

// Bootup code

$("#tab-feed").addClass("active");
updateFeed();
