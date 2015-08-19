/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

define(function (require, exports, module) {
    "use strict";
    
    var NativeApp=brackets.getModule('utils/NativeApp');
    
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
        var path=e.path;
        var touchTarget=e.target;
        
        var isBroken;
        for (var a in path)if(path.hasOwnProperty(a)){
            var step=path[a];
            
            //TO-DO: next arrays should be editable so everyone can enter new values
            var badParentsIdList=['sidebar', 'status-bar', 'main-toolbar', 'problems-panel'];
            var badParentsClassList=['dropdown-menu'];
            var hasBadIdParent=(badParentsIdList.indexOf(step.id)>-1);
            var hasBadClassParent, isBadLink;
            
            if(step.classList){
                for (var a in badParentsClassList)if(badParentsClassList.hasOwnProperty(a)){
                    var badClass=badParentsClassList[a];
                    if(step.classList.contains(badClass)) hasBadClassParent=true;
                }
                if(step.classList.contains('modal-body') && touchTarget.tagName=='A') isBadLink=true;
            }
            
            if(hasBadIdParent || hasBadClassParent || isBadLink){ 
                isBroken=true;
            }
        }
        return (isBroken)?touchTarget:false;
    }
    
    //check if a close button was pressed on the working-set-view item
    function closeButtonPressedCheck(e, x, y){
        var touchTarget;
        var children=[];
        
        if(e.target.classList.contains('extension')) {
            $(e.target.parentElement.parentElement).trigger('mouseover')
            children=e.target.parentElement.parentElement.children;
        } else if(e.target.tagName=="LI"){
            $(e.target).trigger('mouseover');    
            children=e.target.children;
        } else {
            $(e.target.parentElement).trigger('mouseover');    
            children=e.target.parentElement.children;
        }
        
        $(children).each(function(i, doc){
            if(doc.classList.contains('can-close')){
                var closeButtonDiv=$(doc);
                var x1 = closeButtonDiv.offset().left;
                var y1 = closeButtonDiv.offset().top;
                var h1 = closeButtonDiv.outerHeight(true);
                var w1 = closeButtonDiv.outerWidth(true);
                var b1 = y1 + h1;
                var r1 = x1 + w1;

                if(x>x1 && x<r1 && y>y1 && y<b1) touchTarget=doc;
            }
        })
        return touchTarget;
    }
    
    function doubleClickEvent() {
        var event = document.createEvent( "MouseEvents" );
        event.initMouseEvent( 'dblclick', true, true, window, 0, 0, 0, 1, 1, false, false,false,false, 0, document.body.parentNode );
        return event;
    }
    
    //main event handler
    function clickEvent(e){
        if(!extensionEnabled) return;
        var brokenTarget=isBrokenCheck(e);
        if(!brokenTarget) return;
        e.preventDefault();
        var isRightClick=(e.timeStamp-touchstartEvent.timeStamp>rightClickDelay);
        var isDoubleClick=(previousTouchEndEvent && e.timeStamp-previousTouchEndEvent.timeStamp<doubleClickDelay);
        if(isRightClick) return;
        
        var pageX=e.changedTouches[0].pageX;
        var pageY=e.changedTouches[0].pageY;
        var node = e.changedTouches[0].target, url;
        var click=true;

        while (node) {
            //"open-in-browser-link" check
            if (node.tagName === "A") {
                url = node.getAttribute("href");
                if (url && !url.match(/^#/)) {
                    NativeApp.openURLInDefaultBrowser(url);
                    break;
                }
            }
            //working-set-view check to provide close buttons working
            if(node.parentElement && node.parentElement.classList.contains('working-set-view')){
                click=false;
                var closePressed=closeButtonPressedCheck(e, pageX, pageY);
                if(closePressed) brokenTarget=closePressed;
                break;
            }
            node = node.parentElement;
        }
        
        if(isDoubleClick) {
            $(brokenTarget)[0].dispatchEvent(doubleClickEvent());
        } else if(click){
            $(brokenTarget).click();
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