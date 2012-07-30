// Event Handlers

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
$("#tweetBox").keypress(resizeIt);
$("#searchBox").keypress(function(e) {
    if(e.keyCode==13) {
        var query = $("#searchBox").val();
        window.location.hash = "#search/"+query;
        $("#searchBox").val("");
    }
});
$("#followButton").click(function() {
    $.get('/backend/follow/'+profileUserId,{},function(data) {
        if(data['display']=="login")
            window.location = "/frontend/login.html";
        myProfile = processProfile(data['myProfile']);
        displayedProfile = processProfile(data['currentProfile']);
        showProfile(displayedProfile);
        alert(data['message']);
    }, "json");
});
$("#unfollowButton").click(function() {
    $.get('/backend/unfollow/'+profileUserId,{},function(data) {
        if(data['display']=="login")
            window.location = "/frontend/login.html";
        myProfile = processProfile(data['myProfile']);
        displayedProfile = processProfile(data['currentProfile']);
        showProfile(displayedProfile);
        alert(data['message']);
    }, "json");
});
$(document).keyup(function(e) {
    if(e.which == 27)
        closepopup(e);
});
window.onhashchange = router;
setInterval(refreshTimes, 30000);
setInterval(refreshFeed, 4000);

// functions

function router() {
    var hash = window.location.hash.substr(1);
    var broken = hash.split("/");
    if(broken[0]=="profile") {
        showTab('profile');
        if(displayedProfile==null||displayedProfile['userid']!=broken[1])
            getProfile(broken[1],showProfile);
        if(broken[2]=="following")
            $("#container").animate({marginLeft:-1720});
        else if(broken[2]=="followers")
            $("#container").animate({marginLeft:-860});
        else
            $("#container").animate({marginLeft:0});
    } else if(broken[0]=="search") {
        showTab('search');
        if(broken.length>1&&displayedSearch!=broken[1]) {
            search(broken[1]);
            displayedSearch = broken[1];
        }
        if(broken.length>2) {
            if(broken[2]=="tweets")
                changesearchTab("Tweet");
            else
                changesearchTab("User");
        }
    } else {
        showTab('feed');
        updateFeed();
    }
}
function popup(list,template) {
    $("#popupClose").href=window.url;
    $("#popupContainer").html("");
    _.each(list, function(item,i) {
        item['id'] = "popup-"+i;
        $("#popupContainer").append(_.template(template, item));
    });
    $("#popupContainer :hidden").show();
    $("#popup").fadeIn();
}
function closepopup(e) {
    if($("#popup").css("display")!="none") {
        $("#popup").fadeOut();
    }
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
        $(this).html(timeDiff(dur)+" ago");
    });
}
function showTab(tab) {
    closepopup();
    $(".sector").removeClass("active");
    $("#tab-"+tab).addClass("active");
    $(".menuitem").removeClass("active");
    $("#menu-"+tab).addClass("active");
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
    if(dur<55) return "about " + round5(dur) + " min";
    dur = Math.ceil(dur/60);
    if(dur<24) return "about " + dur + " hr";
    dur = Math.ceil(dur/24);
    return dur + " days";
}

function updateFeed() {
    var ticker = false;
    if(arguments.length==0)
        ticker = true;
    if(ticker)
        showTicker("Updating Feed...");
    var url = '/backend/feed/';
    var obj = {};
    if(latestFeedId != null) {
        url = '/backend/feed/after';
        obj = { "feedId": latestFeedId };
    }
    $.get(url,obj,function(data) {
        if(data['display']=="login")
            window.location = "/frontend/login.html";
        if(data['tweets'].length>0)
            latestFeedId = data['tweets'][0]['feedid'];
        data['tweets'] = data['tweets'].reverse();
        _.each(data['tweets'], function(tweet,tweetid) {
            tweet['sourceuser'] = JSON.parse(tweet['sourceuser']);
            tweet['postcontent'] = tweet['postcontent'].replace(/\n/g,"<br/>");
            tweet['id'] = "feed-"+tweetid;
            $("#feedContainer").prepend(_.template($("#tmpl-tweet").html(),tweet));
        });
        $("#feedContainer :hidden").slideDown();
        refreshTimes();
        if(ticker)
            hideTicker();
    }, "json");
}
function processProfile(profile) {
    profile['followerslist'] = JSON.parse(profile['followerslist']);
    profile['followinglist'] = JSON.parse(profile['followinglist']);
    _.each(profile['tweets'], function(tweet) {
        tweet['postcontent'] = tweet['postcontent'].replace("\n","<br/>");
        tweet['sourceuser'] = JSON.parse(tweet['sourceuser']);
    });
    return profile;
}
function getProfile(userid,callback) {
    showTicker("Loading Profile...");
    if(userid==null) url = '/backend/myprofile/';
    else url = '/backend/profile/'+userid;
    $.get(url,{},function(data) {
        data = processProfile(data);
        if(userid==null) myProfile = data;
        callback(data);
        hideTicker();
    }, "json");
}
function showProfile(profile) {
    var userid = profile['userid'];
    if(userid!=profileUserId) {
        $("#tweetContainer").html("");
        profileUserId = userid;
    }
    displayedProfile = profile;
    $("#profileUsername").html(profile['username']);
    $("#profileEmailId").html(profile['emailid']);
    $("#profileTweetsLink").attr("href","#profile/"+profileUserId+"/tweets").html(profile['tweets'].length);
    $("#profileFollowersLink").attr("href","#profile/"+profileUserId+"/followers").html(profile['followerslist'].length);
    $("#profileFollowingLink").attr("href","#profile/"+profileUserId+"/following").html(profile['followinglist'].length);
    profile['tweets'] = profile['tweets'].reverse();
    $("#tweetContainer").html("");
    $("#followersContainer").html("");
    $("#followingContainer").html("");
    populateList($("#tweetContainer"),profile['tweets'],$("#tmpl-tweet").html(),"tweet-");
    populateList($("#followersContainer"),profile['followerslist'],$("#tmpl-user").html(),"follower-");
    populateList($("#followingContainer"),profile['followinglist'],$("#tmpl-user").html(),"following-");
    refreshTimes();
    $("#followButton").hide();
    $("#unfollowButton").hide();
    if(profile['userid']==myProfile['userid']) {}
    else if(following(profile['userid'])) $("#unfollowButton").show();
    else $("#followButton").show();
}
function populateList(container,list,template,prefix) {
    _.each(list,function(item,id) {
        item['id'] = prefix+id;
        if(!document.getElementById(item['id']))
            container.prepend(_.template(template,item));
    });
    $(":hidden",container).slideDown();
}
function search(text) {
    showTicker("Searching...");
    $.post('/backend/search/',{ query: text },function(data) {
        if(data['display']=="login")
            window.location = "/frontend/login.html";
        _.each(data['users'], function(user) {
            user['followerslist'] = JSON.parse(user['followerslist']);
        });
        _.each(data['tweets'], function(tweet) {
            tweet['sourceuser'] = JSON.parse(tweet['sourceuser']);
        });
        showSearch(data);
        hideTicker();
    }, "json");
}
function showSearch(result) {
    $("#searchUserLink").attr("href","#search/"+result['query']+"/users");
    $("#searchTweetLink").attr("href","#search/"+result['query']+"/tweets");
    $("#search-query").html(result['query']);
    $("#search-user-count").html(result['users'].length);
    $("#search-tweet-count").html(result['tweets'].length);
    $("#searchUserTab a").html("Users ("+result['users'].length+")");
    $("#searchTweetTab a").html("Tweets ("+result['tweets'].length+")");
    $("#searchUserContainer").html("");
    $("#searchTweetContainer").html("");
    populateList($("#searchUserContainer"),result['users'],$("#tmpl-user").html(),"search-user-");
    populateList($("#searchTweetContainer"),result['tweets'],$("#tmpl-tweet").html(),"search-tweet-");
}

function changesearchTab(tab) {
    $(".searchTab").removeClass("active");
    $("#search"+tab+"Tab").addClass("active");
    $(".searchContainer").removeClass("active");
    $("#search"+tab+"Container").addClass("active");
}

// Data

var latestFeedId = null;
var profileUserId = null;
var myProfile = null;
var displayedProfile = null;
var displayedSearch = null;
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

router();
