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
 */

smInit();

function smInit(){
  var contentArea = document.getElementById("appcontent");
  //contentArea.addEventListener("DOMLinkAdded", smLinkAdded, false);
  contentArea.addEventListener("load", smLoad, true);
  contentArea.addEventListener("select", smTabSelected, false);
}

function smClear(){
  var menu = document.getElementById("stylesheets-menu-popup");
  while(menu.childNodes.length > 1) {
    menu.removeChild(menu.lastChild);
  }
  menu.parentNode.setAttribute("disabled","true");
}

/* this function taken pretty much directly from linkToolbarOverlay.js */
function smRefill(){
  var currentNode = getBrowser().contentDocument.documentElement;
  if (!(currentNode instanceof Components.interfaces.nsIDOMHTMLHtmlElement))
    return;
  currentNode = currentNode.firstChild;
  
  while(currentNode)
  {
    if (currentNode instanceof Components.interfaces.nsIDOMHTMLHeadElement) {
      currentNode = currentNode.firstChild;
      
      while(currentNode)
      {
        if (currentNode instanceof Components.interfaces.nsIDOMHTMLLinkElement)
          smLinkAdded({originalTarget: currentNode});
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

function smLinkAdded(evt){
  var element = evt.originalTarget;
  if (element.ownerDocument != getBrowser().contentDocument ||
      !linkToolbarUI.isLinkToolbarEnabled() ||
      !element instanceof Components.interfaces.nsIDOMHTMLLinkElement ||
      !element.href || (!element.rel && !element.rev))
    return;

  if (element.rel.indexOf("stylesheet") < 0 || element.title=='')
    return;

  var menu = document.getElementById("stylesheets-menu-popup");
  var item = document.createElement("menuitem");
  item.setAttribute("label",element.title);
  item.setAttribute("type","radio");
  item.setAttribute("oncommand", "stylesheetSwitchAll(window._content,'"+element.title+"')");
  menu.appendChild(item);
  menu.parentNode.removeAttribute("disabled");
}

function smTabSelected(evt){
  if (evt.originalTarget.localName != "tabs" ||
      !linkToolbarUI.isLinkToolbarEnabled())
    return;

  smClear();
  smRefill();
}

function smLoad(evt){
  //if (!linkToolbarUI.isLinkToolbarEnabled() || !evt.originalTarget ||
  //     evt.originalTarget.ownerDocument != getBrowser().contentDocument){
  if (!linkToolbarUI.isLinkToolbarEnabled()) {
    return;
  }

  smClear();
  smRefill();
}

function smPopupShowing(){
  var menu = document.getElementById("stylesheets-menu-popup");
  var docStyleSheets = window._content.document.styleSheets;

  // if all else fails, call it basic
  menu.firstChild.setAttribute("checked","true");

  for(var i=0; i < docStyleSheets.length; i++) {
    var curStyleSheet = docStyleSheets[i];
    if(curStyleSheet.title && !curStyleSheet.disabled) {
      var el=menu.getElementsByAttribute("label", curStyleSheet.title);
      if(el && el[0]) {
        menu.firstChild.removeAttribute("checked");
        el[0].setAttribute("checked","true");
      }
    }
  }
}
