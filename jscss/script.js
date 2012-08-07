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
$("#searchBox").dropdown();
$("#tweetBox").keypress(resizeIt);
$("#searchBox").keyup(function(e) {
    var query = $("#searchBox").val();
    var searchContent = "";
    if(e.keyCode==13) {
        displayedSearch = "";
        window.location.hash = "#search/"+query;
    } else {
        if(query.length>2) {
            $.post('/backend/usersearch/',{"query":query},function(data) {
                var template = $("#tmpl-user-search-popup").html();
                _.each(data,function(user,i) {
                    searchContent += _.template(template,user);
                });
                if(data.length==0)
                    searchContent += "<li><a>No users found</a></li>"
                searchContent += "<li class='divider'></li><li><a href='#search/"+query+"'>Search for '"+query+"'</a></li>";
                $("#searchList").html(searchContent);
            }, "json");
        } else {
            $("#searchList").html("<li><a href='#search/"+query+"'>Search for '"+query+"'</a></li>")
        }
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
$("#editProfileSave").click(function() {
    if(!validateEditProfile())
        return true;
    $.post('/backend/editprofile/',{
        "username": $("#editProfileUsername").val(),
        "emailid": $("#editProfileEmail").val(),
        "password":$.md5($("#editProfilePassword").val())
    }, function(data) {
        alert(data['message']);
    }, "json");
});
$("#editProfileBackground").change(function() {
    $("body").css("background","url('"+$(this).val()+"')");
    $.cookie("background",$(this).val());
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
    closeSearchPopup();
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
    } else if(broken[0]=="editProfile") {
        showTab('editprofile');
        showEditProfile();
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
function setup() {
    var background = $.cookie("background");
    if(background!=null) {
        $("body").css("background","url('"+background+"')");
    } else {
        background = $("body").css("background-image");
        background = background.substr(4,background.length-5);
        $.cookie("background",background);
    }
    $("#editProfileBackground").val(background);
    $("#tweetBox").focus();
}
function closeSearchPopup() {
    $("#menu-search").removeClass("open");
    $("#searchBox").blur();
    $("#searchBox").val("");
    $("#searchList").html("<li><a>Start typing to search users</a></li>")
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
function trim(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}
function updateMiniProfile(profile) {
    $("#miniProfilePic").attr("src","http://www.gravatar.com/avatar/"+gravatarhashfunction(profile['emailid'])+"?s=");
    $("#miniProfileName").html(profile['username']);
    $("#miniProfileId").html(profile['userid']);
    $("#miniProfileTweets").html(profile['postcount']);
    $("#miniProfileFollowers").html(profile['followerscount']);
    $("#miniProfileFollowing").html(profile['followingcount']);
    $("#miniProfileTweetsLink").attr("href","#profile/"+profile['userid']);
    $("#miniProfileFollowersLink").attr("href","#profile/"+profile['userid']+"/followers");
    $("#miniProfileFollowingLink").attr("href","#profile/"+profile['userid']+"/following");
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
        if(data['tweets'].length>0&&(oldestFeedId==null||oldestFeedId>parseInt(data['tweets'][0]['feedid'])))
            oldestFeedId = parseInt(data['tweets'][0]['feedid']);
        _.each(data['tweets'], function(tweet,tweetid) {
            tweet['sourceuser'] = JSON.parse(tweet['sourceuser']);
            tweet['postcontent'] = tweet['postcontent'].replace(/\n/g,"<br/>");
            tweet['id'] = "feed-"+tweet['feedid'];
            tweet['gravatarhash'] = $.md5(trim(tweet['sourceuser']['emailid']).toLowerCase());
            $("#feedContainer").prepend(_.template($("#tmpl-tweet").html(),tweet));
        });
        $("#feedContainer :hidden").slideDown();
        refreshTimes();
        if(ticker)
            hideTicker();
    }, "json");
}
function loadOlderFeed() {
    showTicker("Getting older feed...");
    $.get('/backend/feed/before',{"feedId":oldestFeedId},function(data) {
        if(data['display']=="login")
            window.location = "/frontend/login.html";
        var length = data['tweets'].length;
        if(length>0)
            oldestFeedId = data['tweets'][length-1]['feedid'];
        _.each(data['tweets'], function(tweet,tweetid) {
            tweet['sourceuser'] = JSON.parse(tweet['sourceuser']);
            tweet['postcontent'] = tweet['postcontent'].replace(/\n/g,"<br/>");
            tweet['gravatarhash'] = gravatarhashfunction(tweet['sourceuser']['emailid']);
            tweet['id'] = "feed-"+tweet['feedid'];
            $("#feedContainer").append(_.template($("#tmpl-tweet").html(),tweet));
        });
        $("#feedContainer :hidden").slideDown();
        refreshTimes();
        hideTicker();
    },"json");
}
function loadOlderTweet() {
    showTicker("Getting older tweets...");
    $.get('/backend/tweets/before',{"postid":oldestTweetId,"userid":displayedProfile['userid']},function(data) {
        if(data['display']=="login")
            window.location = "/frontend/login.html";
        var length = data['tweets'].length;
        if(length>0)
            oldestTweetId = data['tweets'][length-1]['postid'];
        _.each(data['tweets'], function(tweet,tweetid) {
            tweet['sourceuser'] = JSON.parse(tweet['sourceuser']);
            tweet['postcontent'] = tweet['postcontent'].replace(/\n/g,"<br/>");
            tweet['id'] = "feed-"+tweet['feedid'];
            tweet['gravatarhash'] = gravatarhashfunction(tweet['sourceuser']['emailid']);
            $("#tweetContainer").append(_.template($("#tmpl-tweet").html(),tweet));
        });
        $("#tweetContainer :hidden").slideDown();
        refreshTimes();
        hideTicker();
    },"json");
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
function gravatarhashfunction(emailid) {
    return $.md5(trim(emailid).toLowerCase());
}
function showProfile(profile) {
    var userid = profile['userid'];
    if(userid!=profileUserId) {
        $("#tweetContainer").html("");
        profileUserId = userid;
    }
    displayedProfile = profile;
    $("#profileImage").attr("src","http://www.gravatar.com/avatar/"+gravatarhashfunction(profile['emailid'])+"?s=100")
    $("#profileUsername").html(profile['username']);
    $("#profileEmailId").html(profile['emailid']);
    $("#profileTweetsLink").attr("href","#profile/"+profileUserId+"/tweets");
    $("#profileTweets").html(profile['postcount']);
    $("#profileFollowersLink").attr("href","#profile/"+profileUserId+"/followers");
    $("#profileFollowers").html(profile['followerscount']);
    $("#profileFollowingLink").attr("href","#profile/"+profileUserId+"/following");
    $("#profileFollowing").html(profile['followingcount']);
    profile['tweets'] = profile['tweets'].reverse();
    $("#tweetContainer").html("");
    $("#followersContainer").html("");
    $("#followingContainer").html("");
    var length = profile['tweets'].length;
    if(profile['tweets'].length>0)
        oldestTweetId = parseInt(profile['tweets'][0]['postid']);
    else
        oldestTweetId = 0;
    populateListByPrepend($("#tweetContainer"),profile['tweets'],$("#tmpl-tweet").html(),"tweet-","postid");
    populateListByPrepend($("#followersContainer"),profile['followerslist'].slice(0,10),$("#tmpl-user").html(),"follower-","userid");
    populateListByPrepend($("#followingContainer"),profile['followinglist'].slice(0,10),$("#tmpl-user").html(),"following-","userid");
    refreshTimes();
    $("#followButton").hide();
    $("#unfollowButton").hide();
    $("#editProfileButton").hide();
    if(profile['userid']==myProfile['userid']) $("#editProfileButton").show();
    else if(following(profile['userid'])) $("#unfollowButton").show();
    else $("#followButton").show();
}
function populateListByPrepend(container,list,template,prefix,idcol) {
    _.each(list,function(item,id) {
        item['id'] = prefix+item[idcol];
        if(item['sourceuser'])
            item['gravatarhash'] = gravatarhashfunction(item['sourceuser']['emailid']);
        else
            item['gravatarhash'] = gravatarhashfunction(item['emailid']);
        if(!document.getElementById(item['id']))
            container.prepend(_.template(template,item));
    });
    $(":hidden",container).slideDown();
}
function populateListByAppend(container,list,template,prefix,idcol) {
    _.each(list,function(item,id) {
        item['id'] = prefix+item[idcol];
        if(item['sourceuser'])
            item['gravatarhash'] = gravatarhashfunction(item['sourceuser']['emailid']);
        else
            item['gravatarhash'] = gravatarhashfunction(item['emailid']);
        if(!document.getElementById(item['id']))
            container.append(_.template(template,item));
    });
    $(":hidden",container).slideDown();
}
function search(text) {
    showTicker("Searching...");
    $.post('/backend/search/',{ query: text },function(data) {
        if(data['display']=="login")
            window.location = "/frontend/login.html";
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
    populateListByPrepend($("#searchUserContainer"),result['users'],$("#tmpl-user").html(),"search-user-","userid");
    populateListByPrepend($("#searchTweetContainer"),result['tweets'],$("#tmpl-tweet").html(),"search-tweet-","postid");
}

function changesearchTab(tab) {
    $(".searchTab").removeClass("active");
    $("#search"+tab+"Tab").addClass("active");
    $(".searchContainer").removeClass("active");
    $("#search"+tab+"Container").addClass("active");
}
function showMoreFollowing() {
    var length = $("#followingContainer").children().length;
    populateListByAppend($("#followingContainer"),displayedProfile['followinglist'].slice(length,length+10),$("#tmpl-user").html(),"following-","userid");
}
function showMoreFollowers() {
    var length = $("#followersContainer").children().length;
    populateListByAppend($("#followersContainer"),displayedProfile['followerslist'].slice(length,length+10),$("#tmpl-user").html(),"follower-","userid");
}
function updateSearchUser(url) {
    showTicker("(Un)Following user");
    $.get('/backend/'+url,{},function(data) {
        myProfile = processProfile(data['myProfile']);
        var newuserdata = processProfile(data['currentProfile']);
        if(displayedProfile['userid']==newuserdata['userid']) {
            displayedProfile = newuserdata;
            showProfile(displayedProfile);
        }
        newuserdata['id'] = "search-user-"+newuserdata['userid'];
        newuserdata['gravatarhash'] = gravatarhashfunction(newuserdata['emailid']);
        $("#search-user-"+newuserdata['userid']).replaceWith(_.template($("#tmpl-user").html(),newuserdata));
        $("#searchUserContainer :hidden").show();
        hideTicker();
    }, "json");
}
function showEditProfile() {
    if(myProfile!=null) {
        $("#editProfileUsername").val(myProfile['username']);
        $("#editProfileEmail").val(myProfile['emailid']);
        $("#editProfileImage").attr("src","http://www.gravatar.com/avatar/"+gravatarhashfunction(myProfile['emailid']));
    }
}
function validateEditProfile() {
    if($("#editProfilePassword").val()!=$("#editProfileConfirmPassword").val()) {
        alert("Passwords don't match");
        $("#editProfilePassword").val("").focus();
        $("#editProfileConfirmPassword").val("");
        return false;
    }
    return true;
}

// Data

var latestFeedId = null;
var oldestFeedId = null;
var oldestTweetId = null;
var profileUserId = null;
var myProfile = null;
var displayedProfile = null;
var displayedSearch = null;

$.get('/backend/myprofile/',{},function(data) {
    if(data['display']=="login")
        window.location = "/frontend/login.html";
    myProfile = processProfile(data);
    updateMiniProfile(myProfile);
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
setup();
