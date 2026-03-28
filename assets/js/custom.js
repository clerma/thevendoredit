(function ($) {
  "use strict";

  /* ============================================================
     THE EVENT EDIT — Custom JS
     Initializes: Preloader, Navbar scroll, Progress scroll,
     Owl Carousel, Magnific Popup, Waypoints animations,
     Stellar parallax, bg-img backgrounds
  ============================================================ */

  /* ---- Background image from data-background -------------- */
  function initBgImages() {
    $("[data-background]").each(function () {
      $(this).css("background-image", "url(" + $(this).data("background") + ")");
    });
  }

  /* ---- Preloader ------------------------------------------- */
  function initPreloader() {
    $(window).on("load", function () {
      $("#preloader-status").fadeOut();
      $("#preloader").delay(350).fadeOut("slow");
      $("body").delay(350).css({ overflow: "visible" });
    });
  }

  /* ---- Navbar scroll behavior ------------------------------ */
  function initNavbar() {
    var navbar = $(".navbar");

    $(window).on("scroll", function () {
      if ($(this).scrollTop() > 80) {
        navbar.addClass("nav-scroll");
      } else {
        navbar.removeClass("nav-scroll");
      }
    });

    // Trigger on load in case page is already scrolled
    if ($(window).scrollTop() > 80) {
      navbar.addClass("nav-scroll");
    }
  }

  /* ---- Progress scroll indicator --------------------------- */
  function initProgressScroll() {
    var progressWrap = $(".progress-wrap");
    var progressPath = document.querySelector(".progress-wrap path");

    if (!progressPath) return;

    var pathLength = progressPath.getTotalLength();

    progressPath.style.transition = progressPath.style.WebkitTransition = "none";
    progressPath.style.strokeDasharray = pathLength + " " + pathLength;
    progressPath.style.strokeDashoffset = pathLength;
    progressPath.getBoundingClientRect();
    progressPath.style.transition = progressPath.style.WebkitTransition =
      "stroke-dashoffset 20ms linear";

    function updateProgress() {
      var scroll = $(window).scrollTop();
      var height = $(document).height() - $(window).height();
      var progress = pathLength - (scroll * pathLength) / height;
      progressPath.style.strokeDashoffset = progress;

      if (scroll > 100) {
        progressWrap.addClass("active-progress");
      } else {
        progressWrap.removeClass("active-progress");
      }
    }

    $(window).on("scroll", updateProgress);
    updateProgress();

    // Scroll to top on click
    progressWrap.on("click", function (e) {
      e.preventDefault();
      $("html, body").animate({ scrollTop: 0 }, 550);
    });
  }

  /* ---- Hero Slider (Owl Carousel) -------------------------- */
  function initHeroSlider() {
    var $hero = $(".header.slider-fade .owl-carousel");
    if (!$hero.length) return;

    $hero.owlCarousel({
      items: 1,
      loop: true,
      autoplay: true,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      smartSpeed: 800,
      dots: true,
      nav: false,
      animateOut: "fadeOut",
      animateIn: "fadeIn",
    });
  }

  /* ---- Category Carousel (Owl Carousel) -------------------- */
  function initCategoryCarousel() {
    var $carousel = $(".categories .owl-carousel");
    if (!$carousel.length) return;

    $carousel.owlCarousel({
      loop: true,
      autoplay: true,
      autoplayTimeout: 3500,
      autoplayHoverPause: true,
      smartSpeed: 600,
      dots: true,
      nav: true,
      navText: [
        '<i class="ti-angle-left"></i>',
        '<i class="ti-angle-right"></i>',
      ],
      responsive: {
        0:   { items: 1 },
        480: { items: 2 },
        768: { items: 3 },
        992: { items: 4 },
        1200: { items: 5 },
      },
    });
  }

  /* ---- Generic Owl Carousel (any other carousels) ---------- */
  function initOwlCarousels() {
    $(".owl-carousel").not(".header .owl-carousel, .categories .owl-carousel").each(function () {
      var $el = $(this);
      if ($el.hasClass("owl-loaded")) return;

      $el.owlCarousel({
        items: 3,
        loop: true,
        autoplay: true,
        autoplayTimeout: 4000,
        autoplayHoverPause: true,
        smartSpeed: 600,
        dots: true,
        nav: false,
        responsive: {
          0:   { items: 1 },
          768: { items: 2 },
          992: { items: 3 },
        },
      });
    });
  }

  /* ---- Magnific Popup (gallery lightbox) ------------------- */
  function initMagnificPopup() {
    // Single image popup
    $(".mfp-image").magnificPopup({
      type: "image",
      closeOnContentClick: true,
      closeBtnInside: false,
      fixedContentPos: true,
      mainClass: "mfp-no-margins mfp-with-zoom",
      image: { verticalFit: true },
      zoom: { enabled: true, duration: 300 },
    });

    // Gallery popup (img-zoom class within a shared container)
    $(".vendor-gallery, .wedding-gallery").each(function () {
      $(this).find(".img-zoom").magnificPopup({
        type: "image",
        gallery: { enabled: true },
        closeOnContentClick: false,
        closeBtnInside: false,
        fixedContentPos: true,
        mainClass: "mfp-no-margins mfp-with-zoom",
        image: { verticalFit: true },
        zoom: { enabled: true, duration: 300 },
      });
    });

    // Fallback: any .popup-img not already in a gallery container
    if ($.fn.magnificPopup) {
      $(".popup-img").magnificPopup({ type: "image" });
    }
  }

  /* ---- Waypoints scroll animations ------------------------- */
  function initAnimations() {
    if (typeof Waypoint === "undefined") return;

    $(".animate-box").each(function () {
      var $el = $(this);
      new Waypoint({
        element: $el[0],
        handler: function () {
          $el.addClass("animated");
          this.destroy();
        },
        offset: "90%",
      });
    });
  }

  /* ---- Stellar parallax ------------------------------------ */
  function initStellar() {
    if (typeof $.fn.stellar === "undefined") return;

    $(window).stellar({
      responsive: true,
      parallaxBackgrounds: true,
      parallaxElements: false,
      horizontalScrolling: false,
      hideDistantElements: false,
      scrollProperty: "scroll",
    });
  }

  /* ---- Smooth scroll for anchor links ---------------------- */
  function initSmoothScroll() {
    $('a[href^="#"]').not('[href="#"]').on("click", function (e) {
      var target = $(this.getAttribute("href"));
      if (target.length) {
        e.preventDefault();
        $("html, body").animate({ scrollTop: target.offset().top - 80 }, 600);
      }
    });
  }

  /* ---- Active nav link ------------------------------------- */
  function initActiveNav() {
    var path = window.location.pathname;
    $(".navbar-nav .nav-link").each(function () {
      if ($(this).attr("href") === path) {
        $(this).addClass("active");
      }
    });
  }

  /* ---- Bootstrap dropdown on hover (desktop) --------------- */
  function initDropdownHover() {
    if ($(window).width() > 991) {
      $(".navbar .dropdown").on("mouseenter", function () {
        $(this).find(".dropdown-menu").stop(true, true).fadeIn(200);
        $(this).addClass("show");
        $(this).find(".dropdown-menu").addClass("show");
      }).on("mouseleave", function () {
        $(this).find(".dropdown-menu").stop(true, true).fadeOut(150);
        $(this).removeClass("show");
        $(this).find(".dropdown-menu").removeClass("show");
      });
    }
  }

  /* ---- Init all -------------------------------------------- */
  $(document).ready(function () {
    initBgImages();
    initPreloader();
    initNavbar();
    initProgressScroll();
    initHeroSlider();
    initCategoryCarousel();
    initOwlCarousels();
    initMagnificPopup();
    initAnimations();
    initStellar();
    initSmoothScroll();
    initActiveNav();
    initDropdownHover();
  });

})(jQuery);
