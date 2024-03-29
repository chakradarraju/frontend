// Event Handlers
$('#tweetBox').on("propertychange textarea textInput", function () {
    var str = $(this).val();
    var len = str.length+1;
    if(len>140) {
        $(this).val(str.substr(0,140));
        len = 140;
    }
    var left = 140 - len;
    if (left < 0) {
        left = 0;
    }
    $('#counter').text('Characters left: ' + left);
});
$("#logoutButton").click(function() {
    $.post('/backend/logout/',{}, function(data) {
        if(data['message']=="Successfully logged out")
            window.location = "/frontend/login.html";
    },"json");
});
$("#registerLoginButton").click(function() {
    window.location = "#feed";
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
        $("#counter").html("");
        $("#tweetBox").focus();
        resizeIt();
        $("#tweetBox").fadeIn();
    });
});
$("#postBtn").click(function() {
    $(this).attr("disabled","disabled");
    showTicker("Posting tweet...");
    $.post("/backend/post/",{
        'postcontent':$("#tweetBox").val()
    }, function() {
        hideTicker();
        $("#tweetBox").fadeOut(function() {
            $("#tweetBox").val("");
            $("#counter").html("");
            resizeIt();
            $("#tweetBox").blur();
            $("#tweetBox").fadeIn();
        });
        document.getElementById("postBtn").removeAttribute("disabled");
        updateFeed();
        myProfile['postcount']++;
        updateMiniProfile(myProfile);
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
        setMyProfile(processProfile(data['myProfile']));
        displayedProfile = processProfile(data['currentProfile']);
        showProfile(displayedProfile);
        myalert(data['message']);
    }, "json");
});
$("#unfollowButton").click(function() {
    $.get('/backend/unfollow/'+profileUserId,{},function(data) {
        if(data['display']=="login")
            window.location = "/frontend/login.html";
        setMyProfile(processProfile(data['myProfile']));
        displayedProfile = processProfile(data['currentProfile']);
        showProfile(displayedProfile);
        myalert(data['message']);
    }, "json");
});
$("#editProfileSave").click(function() {
    if(!validateEditProfile())
        return true;
    var password = $("#editProfilePassword").val(), confirmPassword = $("#editProfileConfirmPassword").val();
    var currentpassword = "";
    if($("#editProfileCurrentPassword").val()!="")
        currentpassword = $.md5($("#editProfileCurrentPassword").val());
    var md5ed = $.md5(password);
    if(password=="") md5ed = "";
    $.post('/backend/editprofile/',{
        "username": $("#editProfileUsername").val(),
        "emailid": $("#editProfileEmail").val(),
        "currentpassword": currentpassword,
        "password":md5ed
    }, function(data) {
        myalert(data['message']);
    }, "json");
});
$("#editProfileBackground").change(function() {
    $("body").css("background","url('"+$(this).val()+"')");
    $.cookie("background",$(this).val());
});
$("#profilePicForm").ajaxForm(function(data) {
    myalert(data['message']);
    $("#editProfileImage").attr("src","avatar/"+myProfile['userid']+"?time="+new Date().getTime());
},"json");
$("#bookmarkInput").keyup(function(e) {
    if(e.which == 13) {
        var now = $(this).val();
        if(now!="") {
            addToBookmark(now);
            $(this).val("");
        }
    }
});
$("#bookmarkButton").click(function() {
    var now = $("#bookmarkInput").val();
    if(now!="")
        addToBookmark(now);
    $("#bookmarkInput").val("");
});
$(document).keyup(function(e) {
    if(e.which == 27)
        closealert(e);
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
        updateMyProfile();
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
function myalert(message) {
    $("#messageContent").html(message);
    $("#message").slideDown();
}
function closealert(e) {
    if($("#message").css("display")!="none") {
        $("#message").slideUp();
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
    $("#miniProfilePic").attr("src","avatar/"+profile['userid']);
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
    if(myProfile==null)
        updateMyProfile();
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
        data['tweets'] = processTweets(data['tweets']);
        data['tweets'] = data['tweets'].reverse();
        if(data['tweets'].length>0&&(oldestFeedId==null||oldestFeedId>parseInt(data['tweets'][0]['feedid'])))
            oldestFeedId = parseInt(data['tweets'][0]['feedid']);
        _.each(data['tweets'], function(tweet,tweetid) {
            tweet['sourceuser'] = JSON.parse(tweet['sourceuser']);
            tweet['postcontent'] = tweet['postcontent'].replace(/\n/g,"<br/>");
            tweet['id'] = "feed-"+tweet['feedid'];
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
        if(data['message']=="Userid does not exist") {
            myalert("User not found");
            window.location = "#feeds";
            return;
        }
        data = processProfile(data);
        if(userid==null) setMyProfile(data);
        callback(data);
        hideTicker();
    }, "json");
}
function processTweets(tweets) {
    _.each(tweets,function(tweet,i) {
        tweets[i] = processTweet(tweet);
    });
    return tweets;
}
function isAlphaNum(character) {
    if(character>='a'&&character<='z')
        return true;
    if(character>='A'&&character<='Z')
        return true;
    if(character>='0'&&character<='9')
        return true;
    return false;
}
function processTweet(tweet) {
    var text = tweet['postcontent'], result = "";
    var len = text.length;
    var mention = false;
    for(var i=0;i<len;i++) {
        if(mention&&!isAlphaNum(text[i])) {
            result += "</a>";
            mention = false;
        }
        if(text[i]=='@') {
            mention = true;
            result += "<a onclick='taketoprofile(this)' href='javascript:void(0);'>";
        } else {
            result += text[i];
        }
    }
    if(mention)
        result += "</a>";
    tweet['postcontent'] = result;
    return tweet;
}
function taketoprofile(item) {
    window.location = "#profile/"+item.innerHTML;
}
function showProfile(profile) {
    var userid = profile['userid'];
    if(userid!=profileUserId) {
        $("#tweetContainer").html("");
        profileUserId = userid;
    }
    displayedProfile = profile;
    $("#profileImage").attr("src","avatar/"+profile['userid'])
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
    profile['tweets'] = processTweets(profile['tweets']);
    populateListByPrepend($("#tweetContainer"),profile['tweets'],$("#tmpl-tweet").html(),"tweet-","postid");
    populateListByPrepend($("#followersContainer"),profile['followerslist'].slice(0,10),$("#tmpl-user").html(),"follower-","userid");
    populateListByPrepend($("#followingContainer"),profile['followinglist'].slice(0,10),$("#tmpl-user").html(),"following-","userid");
    refreshTimes();
    $("#followButton").hide();
    $("#unfollowButton").hide();
    $("#editProfileButton").hide();
    if(following(profile['userid'])) $("#unfollowButton").show();
    else if(myProfile!=null&&profile['userid']==myProfile['userid']) $("#editProfileButton").show();
    else $("#followButton").show();
}
function populateListByPrepend(container,list,template,prefix,idcol) {
    _.each(list,function(item,id) {
        item['id'] = prefix+item[idcol];
        if(!document.getElementById(item['id']))
            container.prepend(_.template(template,item));
    });
    $(":hidden",container).slideDown();
}
function populateListByAppend(container,list,template,prefix,idcol) {
    _.each(list,function(item,id) {
        item['id'] = prefix+item[idcol];
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
    _.each(result['users'],function(user,i) {
        result['users'][i]['showbutton'] = true;
    });
    result['tweets'] = processTweets(result['tweets']);
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
        setMyProfile(processProfile(data['myProfile']));
        var newuserdata = processProfile(data['currentProfile']);
        if(displayedProfile['userid']==newuserdata['userid']) {
            displayedProfile = newuserdata;
            showProfile(displayedProfile);
        }
        newuserdata['id'] = "search-user-"+newuserdata['userid'];
        $("#search-user-"+newuserdata['userid']).replaceWith(_.template($("#tmpl-user").html(),newuserdata));
        $("#searchUserContainer :hidden").show();
        hideTicker();
    }, "json");
}
function showEditProfile() {
    if(myProfile!=null) {
        $("#editProfileUsername").val(myProfile['username']);
        $("#editProfileEmail").val(myProfile['emailid']);
        $("#editProfileImage").attr("src","avatar/"+myProfile['userid']);
    }
}
function validateEditProfile() {
    if($("#editProfilePassword").val()!=$("#editProfileConfirmPassword").val()) {
        myalert("Passwords don't match");
        $("#editProfilePassword").val("").focus();
        $("#editProfileConfirmPassword").val("");
        return false;
    }
    if($("#editProfileUsername").val()==""){
        myalert("Enter Username");
        $("#editProfileUsername").val("").focus();
        return false;
    }
    var password = $("#editProfilePassword").val(), confirmPassword = $("#editProfileConfirmPassword").val();
    if(password.length>0&&password.length<6){
        myalert("Passwords should not be less than 6 characters");
        $("#editProfileConfirmPassword").val("");
        $("#editProfilePassword").val("").focus();
        return false;
    }
    if(password!=confirmPassword) {
        myalert("Passwords do not match");
        $("#editProfileConfirmPassword").val("");
        $("#editProfilePassword").val("").focus();
        return false;
    }
    if($("#editProfileEmail").val().match("^[_A-Za-z0-9-]+(\.[_A-Za-z0-9-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$")==null) {
        myalert("Invalid Email");
        $("#editProfileEmail").focus();
        return false;
    }
    return true;
}
function updateMyProfile() {
    $.get('/backend/myprofile/',{},function(data) {
        if(data['display']=="login")
            myProfile = null;
        else
            setMyProfile(processProfile(data));
    }, "json");
}
function setMyProfile(profile) {
    myProfile = profile;
    updateMiniProfile(profile);
    showEditProfile();
    loadBookMarks();
    showLogout();
}
function showLogout() {
    $("#logoutButton").show();
    $("#registerLoginButton").hide();
}
function retweet(postid) {
    $.post('/backend/retweet/',{"postid":postid},function(data) {
        myalert(data['message']);
    },"json");
}
function addToBookmark(userid) {
    bookmarkList.push(userid);
    $.cookie("bookmarkList-"+myProfile['userid'],JSON.stringify(bookmarkList));
    $("#bookmarkList").prepend(renderBookmark(userid));
    $("#bookmarkList :hidden").slideDown();
}
function removeFromBookmark(userid,item) {
    $(item).parent().slideUp(function() {
        $(this).remove();
    });
    var newBookmarkList = [];
    for(bookmarkid in bookmarkList) {
        if(bookmarkList[bookmarkid]!=userid)
            newBookmarkList.push(bookmarkList[bookmarkid]);
    }
    bookmarkList = newBookmarkList;
    $.cookie("bookmarkList-"+myProfile['userid'],JSON.stringify(bookmarkList));
}
function renderBookmark(userid) {
    return "<li style='display: none;'><a href='javascript:void(0);' onclick=\"removeFromBookmark('"+userid+"',this)\">x</a> <a href='#profile/"+userid+"'>"+userid+"</a></li>";
}
function loadBookMarks() {
    var fromCookie = $.cookie("bookmarkList-"+myProfile['userid']);
    if(fromCookie==null) bookmarkList = [];
    else bookmarkList = JSON.parse(fromCookie);
    _.each(bookmarkList,function(userid) {
        $("#bookmarkList").prepend(renderBookmark(userid));
    });
    $("#bookmarkList :hidden").slideDown();
}

// Data

var latestFeedId = null;
var oldestFeedId = null;
var oldestTweetId = null;
var profileUserId = null;
var myProfile = null;
var displayedProfile = null;
var displayedSearch = null;
var bookmarkList = [];
function following(userid) {
    if(myProfile==null)
        return false;
    for(i in myProfile['followinglist']) {
        if(myProfile['followinglist'][i]['userid']==userid)
            return true;
    }
    return false;
}

// Bootup code

router();
setup();
