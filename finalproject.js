
(function($, document, window, undefined) {
    'use strict';
  
    $.fn.pagepiling = function(custom) {
      var PP = $.fn.pagepiling;
      var container = $(this);
      var lastScrolledDestiny;
      var lastAnimation = 0;
      var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints));
      var touchStartY = 0,
        touchStartX = 0,
        touchEndY = 0,
        touchEndX = 0;
      var scrollings = [];
  
      //სიჩქარე 
      var scrollDelay = 600;
  
      var options = $.extend(true, {
        direction: 'vertical',
        menu: null,
        verticalCentered: true,
        sectionsColor: [],
        anchors: [],
        scrollingSpeed: 700,
        easing: 'easeInQuart',
        loopBottom: false,
        loopTop: false,
        css3: false,
        navigation: {
          textColor: '#78858B',
          bulletsColor: '#78858B',
          position: 'right',
          tooltips: []
        },
        normalScrollElements: null,
        normalScrollElementTouchThreshold: 5,
        touchSensitivity: 5,
        keyboardScrolling: true,
        sectionSelector: '.section',
        animateAnchor: false,
  
        
        afterLoad: null,
        onLeave: null,
        afterRender: null
      }, custom);
  
      $.extend($.easing, {
        easeInQuart: function(x, t, b, c, d) {
          return c * (t /= d) * t * t * t + b;
        }
      });
  
   
      PP.setScrollingSpeed = function(value) {
        options.scrollingSpeed = value;
      };
  
    
      PP.setMouseWheelScrolling = function(value) {
        if (value) {
          addMouseWheelHandler();
        } else {
          removeMouseWheelHandler();
        }
      };
  

      PP.setAllowScrolling = function(value) {
        if (value) {
          PP.setMouseWheelScrolling(true);
          addTouchHandler();
        } else {
          PP.setMouseWheelScrolling(false);
          removeTouchHandler();
        }
      };
  
     
      PP.setKeyboardScrolling = function(value) {
        options.keyboardScrolling = value;
      };
  
     
      PP.moveSectionUp = function() {
        var prev = $('.pp-section.active').prev('.pp-section');
  
        if (!prev.length && options.loopTop) {
          prev = $('.pp-section').last();
        }
  
        if (prev.length) {
          scrollPage(prev);
        }
      };
  
      PP.moveSectionDown = function() {
        var next = $('.pp-section.active').next('.pp-section');
  

        if (!next.length && options.loopBottom) {
          next = $('.pp-section').first();
        }
  
        if (next.length) {
          scrollPage(next);
        }
      };
  
      
      PP.moveTo = function(section) {
        var destiny = '';
  
        if (isNaN(section)) {
          destiny = $(document).find('[data-anchor="' + section + '"]');
        } else {
          destiny = $('.pp-section').eq((section - 1));
        }
  
        if (destiny.length > 0) {
          scrollPage(destiny);
        }
      };
  
      $(options.sectionSelector).each(function() {
        $(this).addClass('pp-section');
      });
  
      if (options.css3) {
        options.css3 = support3d();
      }
  
      $(container).css({
        'overflow': 'hidden',
        '-ms-touch-action': 'none',
        
        'touch-action': 'none' 
      });
  
      
      PP.setAllowScrolling(true);
  
     
      if (!$.isEmptyObject(options.navigation)) {
        addVerticalNavigation();
      }
  
      var zIndex = $('.pp-section').length;
  
      $('.pp-section').each(function(index) {
        $(this).data('data-index', index);
        $(this).css('z-index', zIndex);
  
        if (!index && $('.pp-section.active').length === 0) {
          $(this).addClass('active');
        }
  
        if (typeof options.anchors[index] !== 'undefined') {
          $(this).attr('data-anchor', options.anchors[index]);
        }
  
        if (typeof options.sectionsColor[index] !== 'undefined') {
          $(this).css('background-color', options.sectionsColor[index]);
        }
  
        if (options.verticalCentered && !$(this).hasClass('pp-scrollable')) {
          addTableClass($(this));
        }
  
        zIndex = zIndex - 1;
      }).promise().done(function() {
        if (options.navigation) {
          $('#pp-nav').css('margin-top', '-' + ($('#pp-nav').height() / 2) + 'px');
          $('#pp-nav').find('li').eq($('.pp-section.active').index('.pp-section')).find('a').addClass('active');
        }
  
        $(window).on('load', function() {
          scrollToAnchor();
        });
  
        $.isFunction(options.afterRender) && options.afterRender.call(this);
      });
  
      function addTableClass(element) {
        element.addClass('pp-table').wrapInner('<div class="pp-tableCell" style="height:100%" />');
      }
  
     
      function getYmovement(destiny) {
        var fromIndex = $('.pp-section.active').index('.pp-section');
        var toIndex = destiny.index('.pp-section');
  
        if (fromIndex > toIndex) {
          return 'up';
        }
        return 'down';
      }
  
      
      function scrollPage(destination, animated) {
        var v = {
          destination: destination,
          animated: animated,
          activeSection: $('.pp-section.active'),
          anchorLink: destination.data('anchor'),
          sectionIndex: destination.index('.pp-section'),
          toMove: destination,
          yMovement: getYmovement(destination),
          leavingSection: $('.pp-section.active').index('.pp-section') + 1
        };
  
        
        if (v.activeSection.is(destination)) {
          return;
        }
  
        if (typeof v.animated === 'undefined') {
          v.animated = true;
        }
  
        if (typeof v.anchorLink !== 'undefined') {
          setURLHash(v.anchorLink, v.sectionIndex);
        }
  
        v.destination.addClass('active').siblings().removeClass('active');
  
        v.sectionsToMove = getSectionsToMove(v);
  
        //აქრობს სექციას ასქროლვის შემდეგ 
        if (v.yMovement === 'down') {
          v.translate3d = getTranslate3d();
          v.scrolling = '100%';
  
          if (!options.css3) {
            v.sectionsToMove.each(function(index) {
              if (index != v.activeSection.index('.pp-section')) {
                $(this).css(getScrollProp(v.scrolling));
              }
            });
          }
  
          v.animateSection = v.activeSection;
        }
  
        
        else {
          v.translate3d = 'translate3d(0px, 0px, 0px)';
          v.scrolling = '0';
  
          v.animateSection = destination;
        }
  
        $.isFunction(options.onLeave) && options.onLeave.call(this, v.leavingSection, (v.sectionIndex + 1), v.yMovement);
  
        performMovement(v);
  
        activateMenuElement(v.anchorLink);
        activateNavDots(v.anchorLink, v.sectionIndex);
        lastScrolledDestiny = v.anchorLink;
  
        var timeNow = new Date().getTime();
        lastAnimation = timeNow;
      }
  
      //ქმნის მოძრაობას
      function performMovement(v) {
        if (options.css3) {
          transformContainer(v.animateSection, v.translate3d, v.animated);
  
          v.sectionsToMove.each(function() {
            transformContainer($(this), v.translate3d, v.animated);
          });
  
          setTimeout(function() {
            afterSectionLoads(v);
          }, options.scrollingSpeed);
        } else {
          v.scrollOptions = getScrollProp(v.scrolling);
  
          if (v.animated) {
            v.animateSection.animate(
              v.scrollOptions,
              options.scrollingSpeed, options.easing,
              function() {
                readjustSections(v);
                afterSectionLoads(v);
              });
          } else {
            v.animateSection.css(getScrollProp(v.scrolling));
            setTimeout(function() {
              readjustSections(v);
              afterSectionLoads(v);
            }, 400);
          }
        }
      }
  
  
      function afterSectionLoads(v) {

        $.isFunction(options.afterLoad) && options.afterLoad.call(this, v.anchorLink, (v.sectionIndex + 1));
      }
  
      function getSectionsToMove(v) {
        var sectionToMove;
  
        if (v.yMovement === 'down') {
          sectionToMove = $('.pp-section').map(function(index) {
            if (index < v.destination.index('.pp-section')) {
              return $(this);
            }
          });
        } else {
          sectionToMove = $('.pp-section').map(function(index) {
            if (index > v.destination.index('.pp-section')) {
              return $(this);
            }
          });
        }
  
        return sectionToMove;
      }
  
   //აბრუნებს სექციებს საწყის ფაზაში 
      function readjustSections(v) {
        if (v.yMovement === 'up') {
          v.sectionsToMove.each(function(index) {
            $(this).css(getScrollProp(v.scrolling));
          });
        }
      }
  
      
     //  სქროლვის ეფექტი 
       
      function getScrollProp(propertyValue) {
        if (options.direction === 'vertical') {
          return {
            'top': propertyValue
          };
        }
        return {
          'left': propertyValue
        };
      }
  
      // სქროლავს ანიმაციის გარეშე - მომხმარებელი ამას ვერ ხედავს
      
      function silentScroll(section, offset) {
        if (options.css3) {
          transformContainer(section, getTranslate3d(), false);
        } else {
          section.css(getScrollProp(offset));
        }
      }
  
      // ცვლის ლინკს
       
      function setURLHash(anchorLink, sectionIndex) {
        if (options.anchors.length) {
          location.hash = anchorLink;
  
          setBodyClass(location.hash);
        } else {
          setBodyClass(String(sectionIndex));
        }
      }
  
      // ბოდიკლასის დაყენება დამოკიდებულია აქტიურ სექციაზე

      function setBodyClass(text) {
       
        text = text.replace('#', '');
  
        // კლასის შეცვლა 
        $('body')[0].className = $('body')[0].className.replace(/\b\s?pp-viewing-[^\s]+\b/g, '');
  
    //მიმდინარე კლასის დამატება 
        $('body').addClass('pp-viewing-' + text);
      }
  
      
      function scrollToAnchor() {
          // ახდენს ლინკის ცვლილებას
        var value = window.location.hash.replace('#', '');
        var sectionAnchor = value;
        var section = $(document).find('.pp-section[data-anchor="' + sectionAnchor + '"]');
  
        if (section.length > 0) { 
          scrollPage(section, options.animateAnchor);
        }
      }
  
      // გადასვლები სექციებს შორის სქროლ დილეი ინახავს დეითას 

      function isMoving() {
        var timeNow = new Date().getTime();

        // აჩერბს ანიმაციას თუ მოქმედება შეჩერებულია ან საიტი მოლოდენის რეჟიმშია 

        if (timeNow - lastAnimation < scrollDelay + options.scrollingSpeed) {
          return true;
        }
        return false;
      }
  
      // ნებისმიერ ცვლილების აღმოჩენა ლინკში, რათა დაგვაბრუნოს საწყის ეტაპზე 

      $(window).on('hashchange', hashChangeHandler);
  
      // მოქმედება ლინკის ცვლილების შემთხვევაში 

      function hashChangeHandler() {
        var value = window.location.hash.replace('#', '').split('/');
        var sectionAnchor = value[0];
  
        if (sectionAnchor.length) {
       
            // სექციების გამოძახება ერთი დაჭერით ან ერთი დასწორლვით 

          if (sectionAnchor && sectionAnchor !== lastScrolledDestiny) {
            var section;
  
            if (isNaN(sectionAnchor)) {
              section = $(document).find('[data-anchor="' + sectionAnchor + '"]');
            } else {
              section = $('.pp-section').eq((sectionAnchor - 1));
            }
            scrollPage(section);
          }
        }
      }
  
      
      function getTransforms(translate3d) {
        return {
          '-webkit-transform': translate3d,
          '-moz-transform': translate3d,
          '-ms-transform': translate3d,
          'transform': translate3d
        };
      }
  
      // გადააქვს css კონტეინერის კლასში ანიმაციით ან ანიმაციის გარეშე

      
      function transformContainer(element, translate3d, animated) {
        element.toggleClass('pp-easing', animated);
  
        element.css(getTransforms(translate3d));
      }
  
      // მოძრაობა საიტზე კლავიშებით 
      
      $(document).keydown(function(e) {
        if (options.keyboardScrolling && !isMoving()) {
      
          switch (e.which) {
            //up
            case 38:
            case 33:
              PP.moveSectionUp();
              break;
  
              
            case 40:
            case 34:
              PP.moveSectionDown();
              break;
  
              
            case 36:
              PP.moveTo(1);
              break;
  
              
            case 35:
              PP.moveTo($('.pp-section').length);
              break;
  
              
            case 37:
              PP.moveSectionUp();
              break;
  
              
            case 39:
              PP.moveSectionDown();
              break;
  
            default:
              return; 
          }
        }
      });
  
      //ნავიგაცია საიტზე მაუსით 

      if (options.normalScrollElements) {
        $(document).on('mouseenter', options.normalScrollElements, function() {
          PP.setMouseWheelScrolling(false);
        });
  
        $(document).on('mouseleave', options.normalScrollElements, function() {
          PP.setMouseWheelScrolling(true);
        });
      }
  
      var prevTime = new Date().getTime();
  
      function MouseWheelHandler(e) {
        var curTime = new Date().getTime();
  
    
        e = e || window.event;
        var value = e.wheelDelta || -e.deltaY || -e.detail;
        var delta = Math.max(-1, Math.min(1, value));
  
        var horizontalDetection = typeof e.wheelDeltaX !== 'undefined' || typeof e.deltaX !== 'undefined';
        var isScrollingVertically = (Math.abs(e.wheelDeltaX) < Math.abs(e.wheelDelta)) || (Math.abs(e.deltaX) < Math.abs(e.deltaY) || !horizontalDetection);
  
        // მასივის ლიმიტი 150მდე
        if (scrollings.length > 149) {
          scrollings.shift();
        }
  
        // ითვლის წინა დასქროლვას და გვაძლევს ნავიგაციის საშუალებას დასქროლვით 
        scrollings.push(Math.abs(value));
  
        
        var timeDiff = curTime - prevTime;
        prevTime = curTime;
  
   
        if (timeDiff > 200) {
         
          scrollings = [];
        }
  
        if (!isMoving()) {
          var activeSection = $('.pp-section.active');
          var scrollable = isScrollable(activeSection);
  
          var averageEnd = getAverage(scrollings, 10);
          var averageMiddle = getAverage(scrollings, 70);
          var isAccelerating = averageEnd >= averageMiddle;
  
          if (isAccelerating && isScrollingVertically) {
            //დასქროლვა ქვემოთ 
            if (delta < 0) {
              scrolling('down', scrollable);
  
              //ასქროლვა ზემოთ
            } else if (delta > 0) {
              scrolling('up', scrollable);
            }
          }
  
          return false;
        }
      }
  
      
      function getAverage(elements, number) {
        var sum = 0;
  
 
        var lastElements = elements.slice(Math.max(elements.length - number, 1));
  
        for (var i = 0; i < lastElements.length; i++) {
          sum = sum + lastElements[i];
        }
  
        return Math.ceil(sum / number);
      }
  
    
      function scrolling(type, scrollable) {
        var check;
        var scrollSection;
  
        if (type == 'down') {
          check = 'bottom';
          scrollSection = PP.moveSectionDown;
        } else {
          check = 'top';
          scrollSection = PP.moveSectionUp;
        }
  
        if (scrollable.length > 0) {
          
          if (isScrolled(check, scrollable)) {
            scrollSection();
          } else {
            return true;
          }
        } else {
          
          scrollSection();
        }
      }
  
      
      function isScrolled(type, scrollable) {
        if (type === 'top') {
          return !scrollable.scrollTop();
        } else if (type === 'bottom') {
          return scrollable.scrollTop() + 1 + scrollable.innerHeight() >= scrollable[0].scrollHeight;
        }
      }
  
      
      function isScrollable(activeSection) {
        return activeSection.filter('.pp-scrollable');
      }
  
      // ამ ფუნქციის გამოძახება დაბლოკავს დასქროლვის საშუალებას მაუსით ან სენსორით

      function removeMouseWheelHandler() {
        if (container.get(0).addEventListener) {
          container.get(0).removeEventListener('mousewheel', MouseWheelHandler, false); //IE9, Chrome, Safari, Oper
          container.get(0).removeEventListener('wheel', MouseWheelHandler, false); //Firefox
        } else {
          container.get(0).detachEvent('onmousewheel', MouseWheelHandler); //IE 6/7/8
        }
      }
  
      // ეს ფუნქცია პირიქით მაძლევს საშუალებას ვიმოძრაო მაუსით ან სენსორით 

      function addMouseWheelHandler() {
        if (container.get(0).addEventListener) {
          container.get(0).addEventListener('mousewheel', MouseWheelHandler, false); //IE9, Chrome, Safari, Oper
          container.get(0).addEventListener('wheel', MouseWheelHandler, false); //Firefox
        } else {
          container.get(0).attachEvent('onmousewheel', MouseWheelHandler); //IE 6/7/8
        }
      }
  
      // რთავს ნავიგაცია სენსორულ გაჯეთებზე
      function addTouchHandler() {
        if (isTouch) {
          
          var MSPointer = getMSPointer();
  
          container.off('touchstart ' + MSPointer.down).on('touchstart ' + MSPointer.down, touchStartHandler);
          container.off('touchmove ' + MSPointer.move).on('touchmove ' + MSPointer.move, touchMoveHandler);
        }
      }
  
      
      function removeTouchHandler() {
        if (isTouch) {
          
          var MSPointer = getMSPointer();
  
          container.off('touchstart ' + MSPointer.down);
          container.off('touchmove ' + MSPointer.move);
        }
      }
  
 
      function getMSPointer() {
        var pointer;
  
        if (window.PointerEvent) {
          pointer = {
            down: 'pointerdown',
            move: 'pointermove',
            up: 'pointerup'
          };
        }
  
        
        else {
          pointer = {
            down: 'MSPointerDown',
            move: 'MSPointerMove',
            up: 'MSPointerUp'
          };
        }
  
        return pointer;
      }
  
     
      function getEventsPage(e) {
        var events = new Array();
  
        events.y = (typeof e.pageY !== 'undefined' && (e.pageY || e.pageX) ? e.pageY : e.touches[0].pageY);
        events.x = (typeof e.pageX !== 'undefined' && (e.pageY || e.pageX) ? e.pageX : e.touches[0].pageX);
  
        return events;
      }
  
     
     
  
     
      function touchMoveHandler(event) {
        var e = event.originalEvent;
  
        // 
        if (!checkParentForNormalScrollElement(event.target) && isReallyTouch(e)) {
  
          var activeSection = $('.pp-section.active');
          var scrollable = isScrollable(activeSection);
  
          if (!scrollable.length) {
            event.preventDefault();
          }
  
          if (!isMoving()) {
            var touchEvents = getEventsPage(e);
            touchEndY = touchEvents.y;
            touchEndX = touchEvents.x;
  
            
            if (options.direction === 'horizontal' && Math.abs(touchStartX - touchEndX) > (Math.abs(touchStartY - touchEndY))) {
              //რეაგირება ასქროლვაზე
              if (Math.abs(touchStartX - touchEndX) > (container.width() / 100 * options.touchSensitivity)) {
                if (touchStartX > touchEndX) {
                  scrolling('down', scrollable);
                } else if (touchEndX > touchStartX) {
                  scrolling('up', scrollable);
                }
              }
            } else {
              if (Math.abs(touchStartY - touchEndY) > (container.height() / 100 * options.touchSensitivity)) {
                if (touchStartY > touchEndY) {
                  scrolling('down', scrollable);
                } else if (touchEndY > touchStartY) {
                  scrolling('up', scrollable);
                }
              }
            }
          }
        }
      }
  
      

  
      // ვერტიკალური ნავიგაცია 

      function addVerticalNavigation() {
        $('body').append('<div id="pp-nav"><ul></ul></div>');
        var nav = $('#pp-nav');
  
        nav.css('color', options.navigation.textColor);
  
        nav.addClass(options.navigation.position);
  
        for (var cont = 0; cont < $('.pp-section').length; cont++) {
          var link = '';
          if (options.anchors.length) {
            link = options.anchors[cont];
          }
          if (options.navigation.tooltips !== 'undefined') {
            var tooltip = options.navigation.tooltips[cont];
            if (typeof tooltip === 'undefined') {
              tooltip = '';
            }
          }
  
          nav.find('ul').append('<li data-tooltip="' + tooltip + '"><a href="#' + link + '"><span></span></a></li>');
        }
  
        nav.find('span').css('border-color', options.navigation.bulletsColor);
      }
  
      // ამოძრავებს საიტზე დაჭერის შემდეგ 

      $(document).on('click touchstart', '#pp-nav a', function(e) {
        e.preventDefault();
        var index = $(this).parent().index();
  
        scrollPage($('.pp-section').eq(index));
      });
  
      // მაუსის მიტანისას გიჩვენებს სად გადაგიყვანს 
      $(document).on({
        mouseenter: function() {
          var tooltip = $(this).data('tooltip');
          $('<div class="pp-tooltip ' + options.navigation.position + '">' + tooltip + '</div>').hide().appendTo($(this)).fadeIn(200);
        },
        mouseleave: function() {
          $(this).find('.pp-tooltip').fadeOut(200, function() {
            $(this).remove();
          });
        }
      }, '#pp-nav li');
  
      //ნავიგაცია მინიჭებული სახელის მიხედვით 
      function activateNavDots(name, sectionIndex) {
        if (options.navigation) {
          $('#pp-nav').find('.active').removeClass('active');
          if (name) {
            $('#pp-nav').find('a[href="#' + name + '"]').addClass('active');
          } else {
            $('#pp-nav').find('li').eq(sectionIndex).find('a').addClass('active');
          }
        }
      }
  
    
      function activateMenuElement(name) {
        if (options.menu) {
          $(options.menu).find('.active').removeClass('active');
          $(options.menu).find('[data-menuanchor="' + name + '"]').addClass('active');
        }
      }
  
  
      function support3d() {
        var el = document.createElement('p'),
          has3d,
          transforms = {
            'webkitTransform': '-webkit-transform',
            'OTransform': '-o-transform',
            'msTransform': '-ms-transform',
            'MozTransform': '-moz-transform',
            'transform': 'transform'
          };
  
    
        document.body.insertBefore(el, null);
  
        for (var t in transforms) {
          if (el.style[t] !== undefined) {
            el.style[t] = 'translate3d(1px,1px,1px)';
            has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
          }
        }
  
        document.body.removeChild(el);
  
        return (has3d !== undefined && has3d.length > 0 && has3d !== 'none');
      }
  
      
      function getTranslate3d() {
        if (options.direction !== 'vertical') {
          return 'translate3d(100%, 0px, 0px)';
        }
  
        return 'translate3d(0px, -100%, 0px)';
      }
  
    };
  })(jQuery, document, window);