/*
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "License") you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 * 
 * The Original Code in this file was released on December 15, 2002
 * 
 * Unless otherwise stated, the Initial Developer of the
 * Original Code is David Perry.  Portions created by David Perry are
 * Copyright (C) 2002 David Perry.  All rights reserved.
 * 
 * Contributor(s):
 *   David Perry <d.perry@utoronto.ca> (Original Author)
 *
 * Alternatively, the contents of this file may be used under the
 * terms of the GNU General Public License Version 2 or later (the
 * "GPL"), in which case the provisions of the GPL are applicable
 * instead of those above.  If you wish to allow use of your
 * version of this file only under the terms of the GPL and not to
 * allow others to use your version of this file under the MPL,
 * indicate your decision by deleting the provisions above and
 * replace them with the notice and other provisions required by
 * the GPL.  If you do not delete the provisions above, a recipient
 * may use your version of this file under either the MPL or the
 * GPL.

 What I said in styleLinkToolbarOverlay.xul about licenses also counts here.
 */

/* This isn't in any function declarations, so it gets run immediately
   when this file is loaded for the first time. */
smInit();

function smInit(){
  var contentArea = document.getElementById("appcontent");
  // contentArea is now a reference to the thing holding the HTML documents.
  // When certain events occur, we want to be able to handle them.
  contentArea.addEventListener("load", smLoad, true);
  contentArea.addEventListener("select", smTabSelected, false);
  // 'false' above means don't capture the event, let it keep going
  // so other parts of Mozilla that depend on it won't break
  // (like the link toolbar!)
}

// Helper function to quickly clear out old entries from our menu
function smClear(){
  var menu = document.getElementById("stylesheets-menu-popup");
  while(menu.childNodes.length > 1) {
    menu.removeChild(menu.lastChild);
  }

  // A menu with one option is useless, so let's disable it.
  menu.parentNode.setAttribute("disabled","true");
}
// Pretty straightforward, eh?

/* this function taken pretty much directly from linkToolbarOverlay.js */
// ^ ^ ^ ^ It's polite to cite where you steal code from. (:
function smRefill(){
  var currentNode = getBrowser().contentDocument.documentElement;
  // We've got the current document.  If it's not an HTML document, go away
  if (!(currentNode instanceof Components.interfaces.nsIDOMHTMLHtmlElement))
    return;
  currentNode = currentNode.firstChild;
  
  // Step through the <head> of the document, to find stylesheet refs
  while(currentNode)
  {
    if (currentNode instanceof Components.interfaces.nsIDOMHTMLHeadElement) {
      currentNode = currentNode.firstChild;
      
      while(currentNode)
      {
        if (currentNode instanceof Components.interfaces.nsIDOMHTMLLinkElement)
          smLinkAdded({originalTarget: currentNode});
        // Those curly braces are a quick way of defining an object.
        // This particular object has only one property, originalTarget .
        currentNode = currentNode.nextSibling;
      }
    }
    else if (currentNode instanceof Components.interfaces.nsIDOMElement)
    {
      // head is supposed to be the first element inside html.
      // Got something else instead. returning
       return;
    }
    else
    {
      // Got a comment node or something like that. Moving on.
      currentNode = currentNode.nextSibling;
    }
  }
}

/*** Event handlers ***/

// Any event handler is passed a single argument -- the event that
// triggered it in the first place.
function smLinkAdded(evt){
  var element = evt.originalTarget;
  if (element.ownerDocument != getBrowser().contentDocument ||
      !linkToolbarUI.isLinkToolbarEnabled() ||
      !element instanceof Components.interfaces.nsIDOMHTMLLinkElement ||
      !element.href || (!element.rel && !element.rev))
    return;

  if (element.rel.indexOf("stylesheet") < 0 || element.title=='')
    return;

  // Whew!  If we made it through all that, then we have a stylesheet.

  // Grab a reference to our menu into the variable 'menu'
  var menu = document.getElementById("stylesheets-menu-popup");

  // Elem.getElementsByAttribute returns an array of all the elements of
  // Elem that have the given attribute set to the given value.
  // Multiple stylesheets can be used in one 'theme', and they're linked
  // by all having the same title.  So, if this is a duplicate name
  // for a stylesheet, go away.
  if(menu.getElementsByAttribute("label", element.title).length > 0)
    return;

  // Make a new option to go in our menu.  Name it after the stylesheet's title
  var item = document.createElement("menuitem");
  item.setAttribute("label",element.title);
  item.setAttribute("type","radio");
  item.setAttribute("oncommand", "stylesheetSwitchAll(window._content,'"+element.title+"')");
  menu.appendChild(item);

  // Just in case the menu was disabled before, we re-enable it.
  // It is important to *remove* this attribute.  Setting "disabled" to
  // "false" does *not* have the same effect!
  menu.parentNode.removeAttribute("disabled");
}

// If you look up, you'll recall this function is meant to handle whenever
// the user switches tabs.
function smTabSelected(evt){
  if (evt.originalTarget.localName != "tabs" ||
      !linkToolbarUI.isLinkToolbarEnabled())
    return;

  // Wipe out the old, bring in the new.
  smClear();
  smRefill();
}

// This one gets called when the document is done loading.
// (Ideally, I'd have a function that gets called as each <link> element
// is loaded, but I haven't (yet) found a way to do so without messing up
// the link toolbar.
function smLoad(evt){
  if (!linkToolbarUI.isLinkToolbarEnabled()) {
    return;
  }

  // Wipe out the old, bring in the new.
  smClear();
  smRefill();
}

// This one was referenced in the .xul file.  It gets called each time
// the user clicks on the menu.  (Unless the menu's disabled.)
function smPopupShowing(){
  // Save a reference to our menu...
  var menu = document.getElementById("stylesheets-menu-popup");
  // ...and to the document's available style sheets
  var docStyleSheets = window._content.document.styleSheets;

  // menu is full of 'radio button' menuitems.  So only the last one
  // given 'checked' will keep it.  If all else fails, we want it
  // to be the first one, which is "Basic page style".
  menu.firstChild.setAttribute("checked","true");

  // Step through all available stylesheets.  When we find the one that's
  // in use, move the checkmark next to its option in the menu.
  for(var i=0; i < docStyleSheets.length; i++) {
    var curStyleSheet = docStyleSheets[i];
    if(curStyleSheet.title && !curStyleSheet.disabled) {
      // Remember what I said before about getElementsByAttribute?
      var el=menu.getElementsByAttribute("label", curStyleSheet.title);
      if(el && el[0]) {
        menu.firstChild.removeAttribute("checked");
        el[0].setAttribute("checked","true");
      }
    }
  }
}

// And we're done!  Have a nice day.
