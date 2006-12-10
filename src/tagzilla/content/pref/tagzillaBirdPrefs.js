// vim: set et ts=2 sw=2 sts=2:
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
 * The Original Code in this file was released on April 25, 2005
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

/*
 * Global variables
 */
var mailSample;               // Preview textarea for mail/news
var mailPrefix;               // Preview prefix for mail/news
var mailSuffix;               // Preview suffix for mail/news
var clipSample;               // Preview textarea for clipboard/textarea
var clipPrefix;               // Preview prefix for clipboard/textarea
var clipSuffix;               // Preview suffix for clipboard/textarea
var sampleText;               // Sample tagline for previews

var gAccountManager;          // the account manager
var gIdentities;              // array of mail identities
var gIDpopup;                 // the popup element
var popupCurIndex = null;     // currently selected index of the popup
var popupTimer;               // timer to watch the popup

var haveBrowser;              // Boolean: should we show browser prefs?
var haveMail;                 // Boolean: should we show mail/news prefs?

/*
 * onLoad()
 *
 * called when the prefs page is loaded
 */
function onLoad() {
  try {
    include('chrome://jslib/content/io/dir.js');
    //include('chrome://jslib/content/io/fileUtils.js');
  }
  catch(ex) {
    var page=document.documentElement;

    for(var i=0; i<page.childNodes.length; i++) {
      if(page.childNodes[i].getAttribute("id") != "noJSlib")
        page.childNodes[i].setAttribute("collapsed","true");
    }
    return;
  }
  document.getElementById("noJSlib").setAttribute("collapsed","true");

  clipSample = document.getElementById("clipSample");
  clipPrefix = document.getElementById("tzPref-clipPrefix");
  clipSuffix = document.getElementById("tzPref-clipSuffix");
  mailSample = document.getElementById("mailSample");
  mailPrefix = document.getElementById("tzPref-mailPrefix");
  mailSuffix = document.getElementById("tzPref-mailSuffix");
  sampleText = clipSample.getAttribute("value");

  // Assume the best
  haveMail = true;
  haveBrowser = true;

  // Testing for mail support is easy
  try {
    gAccountManager = Components
      .classes["@mozilla.org/messenger/account-manager;1"]
      .getService(Components.interfaces.nsIMsgAccountManager);
    var idSupports = gAccountManager.allIdentities;
    gIdentities =  queryISupportsArray(idSupports,
      Components.interfaces.nsIMsgIdentity);
    gIDpopup = document.getElementById("msgIdentity");

    // Hide identity list stuff if our prefs service is loaded
    // FIXME: is there a better way?
    var catman = Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager);
    var catStr;
    try {
      catStr = catman.getCategoryEntry("mailnews-accountmanager-extensions",
                            "TagZilla account manager extension");
    }
    catch(ex2) { }

    if( catStr == "@mozilla.org/accountmanager/extension;1?name=tzprefs" ) {
      document.getElementById("tzAccounts").setAttribute("collapsed", "true");
    }
    else
    {
      FillIdentityListPopup(gIDpopup.childNodes[0]);
      setInterval(popupCommand,50);
    }
  }
  catch(ex) {
    haveMail = false;
    document.getElementById("tzMailNewsTab").setAttribute("collapsed", "true");
  }

  // Testing for browser support isn't quite so easy --
  //  is this guaranteed to fail in Thunderbird?
  try {
    var browserInstance = Components
      .classes['@mozilla.org/appshell/component/browser/instance;1']
      .getService(Components.interfaces.nsIBrowserInstance);
  }
  catch(ex) {
    haveBrowser = false;
    document.getElementById("tzBrowserTab").setAttribute("collapsed", "true");
  }

  if( tzDIYdialog ) {
    // if we're our own dialog, we have to init our own prefs

    for (i = 0; i < _elementIDs.length; i++) {
      var curEl = document.getElementById(_elementIDs[i]);
      var prefstring = curEl.getAttribute("prefstring");
      var preftype = curEl.getAttribute("preftype");
      var prefattr = curEl.getAttribute("prefattribute");
      var result = readMyPref( prefstring, preftype, null );
      if(curEl.localName == "radiogroup") {
        for (var x = 0; x < curEl.childNodes.length; x++) {
          if(String(curEl.childNodes[x].value) == String(result)) {
            curEl.selectedItem = curEl.childNodes[x];
            break;
          }
        }
      }
      else if(prefattr == "value") {
        curEl.value = result;
      }
      else
        curEl.setAttribute(prefattr, result);
    }
  }
  else {
    // Otherwise, let Mozilla handle it
    parent.initPanel("chrome://tagzilla/content/pref/tagzillaBirdPrefs.xul");
  }

  // Voodoo taken from ChatZilla to make the charset picker work
  // Phil: Voodoo moved to inline script in tagzillaBirdPrefs.xul

  onMailUpdate();
  onClipUpdate();
}

/*
 * onUnload()
 *
 * called when our pref page is going away
 */
function onUnload() {
  if(haveMail) {
    clearInterval(popupTimer);
    writeAccountSettings();
  }
}

/*
 * onClipUpdate()
 *
 * called when the preview for the clipboard/textarea prefs should change
 */
function onClipUpdate() {
  clipSample.value=clipPrefix.value.replace(/\\n/g,"\n")+
                   sampleText+
                   clipSuffix.value.replace(/\\n/g,"\n");
}

/*
 * onMailUpdate()
 *
 * called when the preview for the mail/news prefs should change
 */
function onMailUpdate() {
  mailSample.value=mailPrefix.value.replace(/\\n/g,"\n")+
                   sampleText+
                   mailSuffix.value.replace(/\\n/g,"\n");
}

/*
 * pickFile()
 *  aTarget: textbox where the chosen filename should go
 *
 * Shows a dialog for the user to pick a tagline file
 */
function pickFile(aTarget) {
  try {
    var oldDir = aTarget.value;
    var newDir = null;
    oldDir = oldDir.substring(0,oldDir.lastIndexOf("/")+1);
    if(oldDir) {
      newDir = new Dir(oldDir);
    }
    var fName = txtFilePicker(getText("chooseFile"),0,newDir);
    if(fName==null) {
    }
    else {
      aTarget.value=fName;
      /*
      var fUtils = new FileUtils();
      var aPath = fUtils.urlToPath(fName);
      aTarget.value=aPath;
      */
    }
  }
  catch(e) {dump(e+'\n');}
}

/*
 * popupCommand()
 *
 * Called when the user changes accounts using the account popup
 */
function popupCommand() {
  if(popupCurIndex != gIDpopup.selectedIndex) {
    var mailAuto = document.getElementById("mailAuto");
    var mailPick = document.getElementById("mailPick");
    var mailFile = document.getElementById("mailFile");

    // save the old account settings
    writeAccountSettings();

    // load the new account settings
    popupCurIndex = gIDpopup.selectedIndex;
    idStr = gIdentities[popupCurIndex].key;
    var temp = readMyPref(String("tagzilla."+idStr+".mailAuto"),"bool",false);
    if(temp)
      mailAuto.setAttribute("checked","true");
    else
      mailAuto.removeAttribute("checked");

    temp = readMyPref(String("tagzilla."+idStr+".mailPick"),"bool",false);
    if(temp)
      mailPick.setAttribute("checked","true");
    else
      mailPick.removeAttribute("checked");

    mailFile.value = readMyPref("tagzilla."+idStr+".mailFile","string","");

    // update checkboxes
    setTimeout(checkMailPrefs,10);
  }
}

/*
 * checkMailPrefs()
 *
 * called when a user checks or unchecks the pref for inserting a tagline
 * into a mail message automatically
 */
function checkMailPrefs() {
  var mailAuto = document.getElementById("mailAuto");
  var mailPick = document.getElementById("mailPick");
  return;
  if(mailAuto.getAttribute("checked")) {
    mailPick.removeAttribute("disabled");
  }
  else {
    mailPick.setAttribute("disabled","true");
  }
}

/*
 * checkTextPrefs()
 *
 * called when a user checks or unchecks the pref for allowing Ctrl-J to
 * insert a tagline into a textarea
 */
function checkTextPrefs() {
  var textAuto = document.getElementById("tzPref-textkey");
  var textPick = document.getElementById("tzPref-textPick");
  if(textAuto.getAttribute("checked")) {
    textPick.removeAttribute("disabled");
  }
  else {
    textPick.setAttribute("disabled","true");
  }
}

/*
 * savePrefs()
 *
 * called when we're our own prefs dialog, so we can save our prefs
 */
function savePrefs() {
  for (i = 0; i < _elementIDs.length; i++) {
    var curEl = document.getElementById(_elementIDs[i]);
    var prefstring = curEl.getAttribute("prefstring");
    var preftype = curEl.getAttribute("preftype");
    var prefattr = curEl.getAttribute("prefattribute");
    var result = (prefattr == "value") ? curEl.value : curEl.getAttribute(prefattr);
    writePref( preftype, prefstring, result );
  }
}

/*
 * writeAccountSettings()
 *
 * write out the current mail account settings when we change accounts
 * via the pulldown, so we don't lose them
 */
function writeAccountSettings() {
  var idStr;
  if(popupCurIndex!=null) {
    var mailAuto = document.getElementById("mailAuto");
    var mailPick = document.getElementById("mailPick");
    var mailFile = document.getElementById("mailFile");

    var idStr = gIdentities[popupCurIndex].key;
    writePref("bool",String("tagzilla."+idStr+".mailAuto"),
      Boolean(mailAuto.hasAttribute("checked")));
    writePref("bool",String("tagzilla."+idStr+".mailPick"),
      Boolean(mailPick.hasAttribute("checked")));
    writePref("string",String("tagzilla."+idStr+".mailFile"),
      mailFile.value);
  }
}

////////////////////////////////////////////////////////////////////////////////
// queryISupportsArray
//
// Parameters:
//  supportsArray: dunno
//  iid: dunno
// Returns: No clue
//
// This function originally appeared in MsgComposeCommands.js
// Used here under the terms of the NPL
////////////////////////////////////////////////////////////////////////////////
function queryISupportsArray(supportsArray, iid) {
    var result = new Array;
    for (var i=0; i<supportsArray.Count(); i++) {
      result[i] = supportsArray.GetElementAt(i).QueryInterface(iid);
    }
    return result;
}

////////////////////////////////////////////////////////////////////////////////
// FillIdentityListPopup
//
// Parameters:
//  popup: the popup to populate
// Returns: Nothing
//
// This function based on code from MsgComposeCommands.js
// Used here under the terms of the NPL
////////////////////////////////////////////////////////////////////////////////
function FillIdentityListPopup(popup)
{
    for (var i=0; i<gIdentities.length; i++)
    {
    var identity = gIdentities[i];

    //Get server prettyName for each identity

    var serverSupports = gAccountManager.GetServersForIdentity(identity);

    //dump(i + " = " + identity.identityName + "," +identity.key + "\n");

    if(serverSupports.GetElementAt(0))
      var result = serverSupports.GetElementAt(0).QueryInterface(Components.interfaces.nsIMsgIncomingServer);
    var accountName = " - "+result.prettyName;

        var item=document.createElement('menuitem');
        item.setAttribute('label', identity.identityName+accountName);
        //item.setAttribute('label', result.prettyName);
        item.setAttribute('class', 'identity-popup-item');
        item.setAttribute('accountname', accountName);
        item.setAttribute('id', identity.key);
        popup.appendChild(item);
    }
    popup.parentNode.selectedIndex = 0;
}
