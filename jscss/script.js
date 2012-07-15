$("li a").click(function() {
    $("body").css("background","url('img/"+$(this).attr("href").substr(1)+"')");
    var lielement = $(this).parent();
    $(lielement).siblings().removeClass("active");
    $(lielement).addClass("active");
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
resizeIt = function() {
    var str = $('#tweetBox').val();
    $('#tweetBox').attr('rows',str.split("\n").length+1);
};
$("#clearBtn").click(function() {
    $("#tweetBox").val("");
    $("#tweetBox").focus();
    resizeIt();
});
$("#tweetBox").keydown(resizeIt);
resizeIt();
