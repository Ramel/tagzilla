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
 * The Original Code in this file was released on August 27, 2004
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
var haveJSlib = true;   // whether JSLib is installed
var tzCmdActions;       // Array storing the send commands we're overriding
//  gCurrentIdentity;   // from parent window
var tzTimer;            // hold timer of setTimeout so it doesn't get set off prematurely

////////////////////////////////////////////////////////////////////////////////
// tzFakeLoad
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzFakeLoad() {
  //window.removeEventListener("load",tzFakeLoad,true);
  if( window.tzLoaded ) return;
  window.tzLoaded = true;
  tzTimer=setTimeout(tzComposeLoad, 1000, window);
}

////////////////////////////////////////////////////////////////////////////////
// tzComposeLoad
//
// Parameters:
//   aWin: the window whose variables are to be set
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzComposeLoad(aWin) {
  try {
    include('chrome://jslib/content/io/file.js');
  }
  catch(ex) {
    //alert(getText("noJSlib"));
    aWin.haveJSlib = false;
    return;
  }
  aWin.addedTagline = false;

  tzOverrideCommands(aWin);

  tzComposeReload();
}

function tzComposeReload() {
  if( !haveJSlib ) return;
  window.addedTagline = false;
  var prefPrefix = "tagzilla."+gCurrentIdentity.key;
  if(readMyPref(prefPrefix+".mailAuto","bool",true) &&
    readMyPref(prefPrefix+".mailPick","bool",false)) {

    tzInsertTagline();
  }
}

function tzOverrideCommands(aWin) {
  /*
     The following method of overriding the commands was found in EnigMail.
     A bit ironic, considering I'm doing this to be able to coexist with EnigMail.
     Check them out: http://enigmail.mozdev.org
  */
  aWin.tzCmdActions = new Object();
  var cmdIDs = ["cmd_sendButton", "cmd_sendNow", "cmd_sendWithCheck", "cmd_sendLater"];
  for (var i=0; i<cmdIDs.length; i++) {
    var id=cmdIDs[i];
    var el=aWin.document.getElementById(id);
    aWin.tzCmdActions[id]=el.getAttribute("oncommand");
    el.setAttribute("oncommand","tzSendCmd('"+id+"')");
  }
}

////////////////////////////////////////////////////////////////////////////////
// tzInsertTagline
//  inserts the tagline
//
// Parameters: none
// Returns: true if it seemed to insert successfully, false otherwise
////////////////////////////////////////////////////////////////////////////////
function tzInsertTagline() {
  var prefPrefix = "tagzilla."+gCurrentIdentity.key;
  var tFile = readMyPref(prefPrefix+".mailFile","string","");
  if(tFile=="") tFile = readMyPref("tagzilla.default.file","string","");
  try {
    var tag = tzRandTaglineFromFile(tFile);
    var prefix = readMyPref("tagzilla.mail.prefix","string","")
      .replace(/\\n/g,"\n");
    var suffix = readMyPref("tagzilla.mail.suffix","string","")
      .replace(/\\n/g,"\n");
    var msgPane = document.getElementById("content-frame");
    if(msgPane) {
      //var controller = document.commandDispatcher.getControllerForCommand('cmd_moveBottom');
      //controller.doCommand('cmd_moveBottom');

      if(msgPane.editorShell) {
        msgPane.editorShell.InsertText(prefix+tag+suffix);
      }
      else if(window.GetCurrentEditor)
      {
        var ed = window.GetCurrentEditor();

        /* We want to re-select the current selection after we insert the
           tagline.  First we need to save it */
        ed.beginTransaction();
        var selection = ed.selection;
        var ranges = [];
        if( selection && selection.rangeCount )
        {
            for( var i=0; i < selection.rangeCount; i++ )
            {
                var r = selection.getRangeAt(i);
                ranges.push( { range:r, start: r.startOffset, end:r.endOffset } );
            }
        }
        // Add the tagline at the end of the document
        ed.endOfDocument();
        ed.insertText(prefix+tag+suffix);

        /* Restore the last selection (which may just be the zero-size
           selection referring to the cursor's location */
        while( selection && ranges.length )
        {
            var r = ranges.shift();
            if( !r.range.collapsed )
                r.range.setEnd( r.range.endContainer, r.end );
            selection.addRange( r.range );
            if( r.range.collapsed )
                selection.collapse( r.range.startContainer, r.start );
        }
        // And we're done
        ed.endTransaction();
      }
      else {
        alert("I'm afraid I don't know how to insert taglines in this version\n"+
              "of Mozilla. File a bug on it, and use Clipboard Mode in the meantime.");
        return false;
      }
      //controller.doCommand('cmd_moveTop');
    }
    else alert("Arg");
  }
  catch(ex) {
    //alert(getText("cantRead"));
    dump("tzInsertTagline: "+ex+"\n");
    return false;
  }
  window.addedTagline = true;
  return true;
}

////////////////////////////////////////////////////////////////////////////////
// tzSendCmd
//
// Parameters:
//  aCmd: the mail command intended to be run
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzSendCmd(aCmd) {
  var prefPrefix = "tagzilla."+gCurrentIdentity.key;
  if(haveJSlib && readMyPref(prefPrefix+".mailAuto","bool",true) &&
    !window.addedTagline ) {
    /*
    if(readMyPref(prefPrefix+".mailPick","bool",false)) {
      tzInsertTagline();
      eval(tzCmdActions[aCmd]);
    }
    else {
    */
      document.firstChild.setAttribute("tzPrefPrefix",prefPrefix); // hack, but it works
      tzCmd=aCmd;
      tagzillaWindow=toTagZilla(aCmd);
      tagzillaWindow.addEventListener("unload",tzPickedTagline, true);
    //}
  }
  else {
    eval(tzCmdActions[aCmd]);
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
  window.addedTagline = true;
  eval(tzCmdActions[tzCmd]);
}
