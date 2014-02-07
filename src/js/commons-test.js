"use strict";

function scrollToFail() {
    var $failEl = $('.test.fail');

    if (!!$failEl.length) {
        $('body').animate({
            scrollTop: $('.test.fail').parent().parent().offset().top
        }, 500);
        return true;
    }
    return false;
}

function scroolToFailOrDisplayDemo(callback) {
    if (!scrollToFail()) {
        var $mocha = $('#mocha');
        $mocha.addClass('slideOutUp animated');
        $mocha.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
            $mocha.hide();
            callback();
        });
    }
}