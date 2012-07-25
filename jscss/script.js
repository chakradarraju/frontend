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
$("#searchBox").keypress(function(e) {
    if(e.keyCode==13) {
        search($("#searchBox").val());
        showTab('search');
        $("#searchBox").val("");
    }
});
$("#followButton").click(function() {
    $.get('/backend/follow/'+profileUserId,{},function(data) {
        alert(data['message']);
        $("#followButton").hide();
        $("#unfollowButton").show();
    }, "json");
});
$("#unfollowButton").click(function() {
    $.get('/backend/unfollow/'+profileUserId,{},function(data) {
        alert(data['message']);
        $("#unfollowButton").hide();
        $("#followButton").show();
    })
});
setInterval(refreshTimes, 10000);
setInterval(refreshFeed, 4000);

// functions

var prevURL = null;
function popup(list) {
    $("#popupClose").href=window.url;
    $("#popupContainer").html("");
    _.each(displayedProfile[list+'list'], function(user,i) {
        $("#popupContainer").append(_.template($("#tmpl-user").html(), {
            id: list+"-"+i,
            userid: user['userid'],
            username: user['username'],
            emailid: user['emailid']
        }));
    });
    $("#popupContainer :hidden").show();
    $("#popup").fadeIn();
}
function closepopup() {
    $("#popup").fadeOut();
    window.url = prevURL;
}
function showProfile(userid) {
    showTab('profile');
    updateProfile(userid);
}
function refreshFeed() {
    if($("#tab-feed").hasClass("active")) updateFeed(false);
}
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
        $(this).html("about "+timeDiff(dur)+" ago");
    });
}
function showTab(tab) {
    closepopup();
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
function round5(x) {
    var ret = parseInt((x+5)/5)*5;
    return ret;
}
function timeDiff(dur) {
    dur = Math.ceil(dur/1000);
    if(dur<55) return "few secs";
    dur = Math.ceil(dur/60);
    if(dur<55) return round5(dur) + " min";
    dur = Math.ceil(dur/60);
    if(dur<24) return dur + " hr";
    dur = Math.ceil(dur/24);
    return dur + " days";
}

function updateFeed() {
    var ticker = false;
    if(arguments.length==0)
        ticker = true;
    if(ticker)
        showTicker("Updating Feed...");
    $.get('/backend/feed/',{},function(data) {
        if(data['display']=="login")
            window.location = "/frontend/login.html";
        for(tweetid in data['tweets']) {
            var tweet = data['tweets'][tweetid];
            if(!document.getElementById("feed-"+tweet['postid'])) {
                tweet['sourceuser'] = JSON.parse(tweet['sourceuser']);
                tweet['postcontent'] = tweet['postcontent'].replace(/\n/g,"<br/>");
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
        if(ticker)
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
        data['followerslist'] = JSON.parse(data['followerslist']);
        data['followinglist'] = JSON.parse(data['followinglist']);
        $("#followers-popup-link").attr("href","#profile/"+profileUserId+"/followers");
        $("#following-popup-link").attr("href","#profile/"+profileUserId+"/following");
        $("#followers-popup-link").attr("onclick","popup('followers');");
        $("#following-popup-link").attr("onclick","popup('following');");
        displayedProfile = data;
        if(userid==myProfile['userid']) myProfile = data;
        $("#profile-emailid").html(data['emailid']);
        $("#profile-username").html(data['username']);
        $("#profile-followers-count").html(data['followerslist'].length);
        $("#profile-following-count").html(data['followinglist'].length);
        for(tweetid in data['tweets']) {
            var tweet = data['tweets'][tweetid];
            tweet['postcontent'] = tweet['postcontent'].replace("\n","<br/>");
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
        $("#followButton").hide();
        $("#unfollowButton").hide();
        if(data['userid']==myProfile['userid']) {}
        else if(following(data['userid'])) $("#unfollowButton").show();
        else $("#followButton").show();
        hideTicker();
    },"json");
}

function search(text) {
    showTicker("Searching...");
    $.post('/backend/search/',{ query: text },function(data) {
        if(data['display']=="login")
            window.location = "/frontend/login.html";
        $("#search-query").html(data['query']);
        $("#search-count").html(data['search'].length);
        $("#searchContainer").html("");
        for(i in data['search']) {
            var user = data['search'][i];
            user['followers'] = JSON.parse(user['followers']);
            $("#searchContainer").append(_.template($("#tmpl-user").html(),{
                id: "search-"+i,
                userid: user['userid'],
                username: user['username'],
                emailid: user['emailid'],
                followers: user['followers']
            }));
            $("#searchContainer :hidden").slideDown();
        }
        hideTicker();
    }, "json");
}


// Data

var profileUserId = null;
var myProfile = null;
var displayedProfile = null;
$.get('/backend/myprofile/',{},function(data) {
    if(data['display']=="login")
        window.location = "/frontend/login.html";
    data['followerslist'] = JSON.parse(data['followerslist']);
    data['followinglist'] = JSON.parse(data['followinglist']);
    myProfile = data;
}, "json");

function following(userid) {
    for(i in myProfile['followinglist']) {
        if(myProfile['followinglist'][i]['userid']==userid)
            return true;
    }
    return false;
}

// Bootup code

$("#tab-feed").addClass("active");
updateFeed();
