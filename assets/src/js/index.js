$(document).ready(function () {
	svg4everybody();//fix svg ie

	$('[data-fancybox]').fancybox({
		closeExisting: true,
		clickOutside: "close",
	});

	$.fancybox.defaults.backFocus = false;

	// $(".swiper-container").hover(function() {
	// 	(this).swiper.autoplay.stop();
	// }, function() {
	// 	(this).swiper.autoplay.start();
	// });

	//$('.lazy').Lazy();

	//$("input[type=tel]").mask("+9(999)999-99-99");

	$('input,textarea').focus(function () {
		$(this).data('placeholder', $(this).attr('placeholder'));
		$(this).attr('placeholder', '');
	});
	$('input,textarea').blur(function () {
		$(this).attr('placeholder', $(this).data('placeholder'));
	});

	$('ul.tabs__caption').on('click', 'li:not(.active)', function () {
		$(this).addClass('active').siblings().removeClass('active').closest('div.tabs').find('div.tabs__content').removeClass('active').eq($(this).index()).addClass('active');
	});
})
