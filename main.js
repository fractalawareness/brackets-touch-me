/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

define(function (require, exports, module) {
    "use strict";
    
    var extensionEnabled=true;
    
    var rightClickDelay=500, doubleClickDelay=500, touchstartEvent, previousTouchEndEvent;
    
    //add a button to turn the extension on and off
    function addExtensionButton(){
        var buttonsBar=$('#main-toolbar .buttons');
        var $button=$('<a>', {id:'toolbar-touch-me', title:'Touch Me', href:'#'});
        $($button).css('backgroundColor', 'cornflowerblue');
        buttonsBar.append($button);
        $($button).on('mouseup touchstart touchend', function(e){
            if(e.type=='touchstart') return e.preventDefault();
            extensionEnabled=(!extensionEnabled);
            $($button).css('backgroundColor', (extensionEnabled)?'cornflowerblue':'gray');
        })
    }
    
    //check if we need to apply it on the current target
    function isBrokenCheck(e){
        //TO-DO: next arrays should be editable so everyone can enter new exceptions
        var exceptionParentsIdList=['editor-holder'];
        var exceptionParentsClassList=[];
        var isException;
        
        var path=e.path;
        for (var a in path)if(path.hasOwnProperty(a)){
            var step=path[a];
            var hasExceptionIdParent=(exceptionParentsIdList.indexOf(step.id)!=-1);
            var hasExceptionClassParent;
            if(step.classList && step.classList.length){
                for (var a in exceptionParentsClassList)if(exceptionParentsClassList.hasOwnProperty(a)){
                    var exceptionClass=exceptionParentsClassList[a];
                    if(step.classList.contains(exceptionClass)) hasExceptionClassParent=true;
                }
            }
            if(hasExceptionIdParent || hasExceptionClassParent) isException=true;
        }
        
        if(!isException) return e.target;
    }
    
    //check if a close button was pressed on the working-set-view item
    function closeButton(e, pageX, pageY){
        var touchTarget;
        
        var elementToMouseOver=e.target.parentElement;
        if(e.target.classList.contains('extension')) {
            elementToMouseOver=e.target.parentElement.parentElement;
        } else if(e.target.tagName=="LI"){
            elementToMouseOver=e.target;
        }
        $(elementToMouseOver).trigger('mouseover');
        
        var children=elementToMouseOver.children;
        $(children).each(function(i, doc){
            if(doc.classList.contains('can-close')){
                var closeButtonDiv=$(doc);
                var buttonX = closeButtonDiv.offset().left;
                var buttonY = closeButtonDiv.offset().top;
                var buttonH = closeButtonDiv.outerHeight(true);
                var buttonW = closeButtonDiv.outerWidth(true);
                var buttonB = buttonY + buttonH;
                var buttonR = buttonX + buttonW;
                if(pageX>buttonX && pageX<buttonR && pageY>buttonY && pageY<buttonB) touchTarget=doc;
            }
        })
        
        return touchTarget;
    }
    
    function createEvent(type) {
        var event = document.createEvent( "MouseEvents" );
        event.initMouseEvent( type || 'click', true, true, 
                             window, 0, 0, 
                             0, 1, 1, 
                             false, false, false,
                             false, 0, document.body.parentNode );
        return event;
    }
    
    //main event handler
    function clickEvent(e){
        if(!extensionEnabled) return;
        var isRightClick=(e.timeStamp-touchstartEvent.timeStamp>rightClickDelay);
        if(isRightClick) return;
        var brokenTarget=isBrokenCheck(e);
        if(!brokenTarget) return;
        
        var click=true;
        var isDoubleClick=(previousTouchEndEvent && e.timeStamp-previousTouchEndEvent.timeStamp<doubleClickDelay);
        
        var pageX=e.changedTouches[0].pageX;
        var pageY=e.changedTouches[0].pageY;
        var node = e.changedTouches[0].target, url;
        while (node) {
            //working-set-view fix and provide close buttons working
            if(node.parentElement && node.parentElement.classList.contains('working-set-view')){
                click=false;
                brokenTarget=closeButton(e, pageX, pageY) || brokenTarget;
                break;
            }
            node = node.parentElement;
        }
        
        e.preventDefault();
        if(click || isDoubleClick) {
            var eventName=(click)?'click':'dblclick';
            $(brokenTarget)[0].dispatchEvent(createEvent(eventName));
        } else {
            $(brokenTarget).mousedown();
            $(brokenTarget).mouseup();
        }
        previousTouchEndEvent=e;
    }
    
    //addExtensionButton();
    document.addEventListener('touchend', clickEvent);
    document.addEventListener('touchstart', function(e){
        touchstartEvent=e;
    });
});