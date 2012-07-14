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
    $(this).prev().slideUp();
    $(this).next().slideUp();
});
