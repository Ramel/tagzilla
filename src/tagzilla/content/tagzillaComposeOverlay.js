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
var tagzillaWindow;     // reference to the TagZilla window
var tzCmd;              // stores the mail command used (eg, cmd_sendButton)
var enigButton;         // reference to the EnigSend button provided by EnigMail
var haveJSlib = true;   // whether JSLib is installed
//  gCurrentIdentity;   // from parent window

////////////////////////////////////////////////////////////////////////////////
// tzComposeLoad
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzComposeLoad() {
  window.removeEventListener("load",tzComposeLoad,true);
  try {
    include('chrome://jslib/content/io/file.js');
  }
  catch(ex) {
    alert(getText("noJSlib"));
    haveJSlib = false;
    return;
  }
  enigButton = document.getElementById("button-enigmail-send");
  if(enigButton) {
    var origCmd = enigButton.getAttribute("command");
    enigButton.setAttribute("command","cmd_sendTagZilla");
    document.getElementById("button-send").setAttribute("command","cmd_sendTagZilla");
  }
}

////////////////////////////////////////////////////////////////////////////////
// tzSendButton
//
// Parameters:
//  aCmd: the mail command intended to be run
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzSendButton(aCmd) {
  var prefPrefix = "tagzilla."+gCurrentIdentity.key;
  if(haveJSlib && readMyPref(prefPrefix+".mailAuto","bool",true)) {
    var tFile = readMyPref(prefPrefix+".mailFile","string","");
    if(tFile=="") tFile = readMyPref("tagzilla.default.file","string","");
    if(readMyPref(prefPrefix+".mailPick","bool",false)) {
      try {
        var tag = tzRandTaglineFromFile(tFile);
        var prefix = readMyPref("tagzilla.mail.prefix","string","")
          .replace(/\\n/g,"\n");
        var suffix = readMyPref("tagzilla.mail.suffix","string","")
          .replace(/\\n/g,"\n");
        var msgPane = document.getElementById("content-frame");
        if(msgPane) {
          var controller = document.commandDispatcher.getControllerForCommand('cmd_moveBottom');
          controller.doCommand('cmd_moveBottom');
          msgPane.editorShell.InsertText(prefix+tag+suffix);
        }
        if(enigButton)
          enigSendCommand(aCmd);
        else
          goDoCommand(aCmd);
      }
      catch(ex) {
        //alert(getText("cantRead"));
        dump(ex+"\n");
        return;
      }
    }
    else {
      document.firstChild.setAttribute("tzPrefPrefix",prefPrefix); // hack, but it works
      tzCmd=aCmd;
      tagzillaWindow=toTagZilla(aCmd);
      tagzillaWindow.addEventListener("unload",tzPickedTagline, true);
    }
  }
  else {
    if(enigButton)
      enigSendCommand(aCmd);
    else
      goDoCommand(aCmd);
  }
}

////////////////////////////////////////////////////////////////////////////////
// tzPickedTagline
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzPickedTagline() {
  tagzillaWindow.removeEventListener("unload", tzPickedTagline, true);
  dump("enigButton = "+enigButton+"!\n");
  if(enigButton)
    enigSendCommand(tzCmd);
  else
    goDoCommand(tzCmd);
}
