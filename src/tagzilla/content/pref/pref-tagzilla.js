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
 * The Original Code in this file was released on September 14, 2002
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

////////////////////////////////////////////////////////////////////////////////
// Global Variables
////////////////////////////////////////////////////////////////////////////////
var gAccountManager;           // the account manager
var gIdentities;               // array of mail identities
var gIDpopup;                  // the popup element
var popupCurIndex = null;      // currently selected index of the popup
var popupTimer;                // timer to watch the popup

////////////////////////////////////////////////////////////////////////////////
// onLoad
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function onLoad() {
  try {
    include('chrome://jslib/content/io/fileUtils.js');
  }
  catch(ex) {
    parent.document.getElementById("tagzilla").setAttribute("container","false");
    var page=document.firstChild;

    for(var i=0; i<page.childNodes.length; i++) {
      if(page.childNodes[i].getAttribute("id") != "noJSlib")
        page.childNodes[i].setAttribute("collapsed","true");
    }
    return;
  }
  document.getElementById("noJSlib").setAttribute("collapsed","true");
  parent.document.getElementById("tagzilla").setAttribute("open","true");

  gAccountManager = Components.classes["@mozilla.org/messenger/account-manager;1"]
    .getService(Components.interfaces.nsIMsgAccountManager);
  var idSupports = gAccountManager.allIdentities;
  gIdentities =  queryISupportsArray(idSupports,
    Components.interfaces.nsIMsgIdentity);
  gIDpopup = document.getElementById("msgIdentity");

  FillIdentityListPopup(gIDpopup.childNodes[0]);

  setInterval(popupCommand,50);
  setTimeout(checkMailPrefs,10);
  setTimeout(checkTextPrefs,10);
}

////////////////////////////////////////////////////////////////////////////////
// onUnload
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function onUnload() {
  clearInterval(popupTimer);
  writeSettings();


  var idStr = gIdentities[popupCurIndex].key;
  writePref("bool",String("tagzilla."+idStr+".mailAuto"),
    Boolean(document.getElementById("mailAuto").hasAttribute("checked")));
  writePref("bool",String("tagzilla."+idStr+".mailPick"),
    Boolean(document.getElementById("mailPick").hasAttribute("checked")));
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
        item.setAttribute('label', identity.identityName);
        item.setAttribute('class', 'identity-popup-item');
        item.setAttribute('accountname', accountName);
        item.setAttribute('id', identity.key);
        popup.appendChild(item);
    }
    popup.parentNode.selectedIndex = 0;
}

////////////////////////////////////////////////////////////////////////////////
// pickFile
//
// Parameters: aTarget: textbox to hold the value
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function pickFile(aTarget) {
  try { 
    var fName = txtFilePicker(getText("chooseFile"),0);
    if(fName==null) {
    }
    else {
      var fUtils = new FileUtils();
      var aPath = fUtils.urlToPath(fName);
      aTarget.value=aPath;
    }
  }
  catch(e) {dump(e+'\n');}
}

////////////////////////////////////////////////////////////////////////////////
// checkMailPrefs
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function checkMailPrefs() {
  var mailAuto = document.getElementById("mailAuto");
  var mailPick = document.getElementById("mailPick");
  if(mailAuto.getAttribute("checked")) {
    mailPick.removeAttribute("disabled");
  }
  else {
    mailPick.setAttribute("disabled","true");
  }
}

////////////////////////////////////////////////////////////////////////////////
// checkTextPrefs
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
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

////////////////////////////////////////////////////////////////////////////////
// writeSettings
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function writeSettings() {
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
// popupCommand
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function popupCommand() {
  if(popupCurIndex != gIDpopup.selectedIndex) {
    var mailAuto = document.getElementById("mailAuto");
    var mailPick = document.getElementById("mailPick");
    var mailFile = document.getElementById("mailFile");

    // save the old account settings
    writeSettings();

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
