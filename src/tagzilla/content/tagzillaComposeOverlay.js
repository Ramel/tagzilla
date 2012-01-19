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

////////////////////////////////////////////////////////////////////////////////
// Global Variables
////////////////////////////////////////////////////////////////////////////////
var tagzillaWindow;     // reference to the TagZilla window
var tzCmd;              // stores the mail command used (eg, cmd_sendButton)
var haveJSlib = true;   // whether JSLib is installed
var tzCmdActions;       // Array storing the send commands we're overriding
//  gCurrentIdentity;   // from parent window
var tzTimer;            // hold timer of setTimeout so it doesn't get set off prematurely
var tzEditorObj;        // Editor object (?? see tzComposeStateListener below)
var tzAddedTagline = false; // Have we already added a tagline?

////////////////////////////////////////////////////////////////////////////////
// tzComposeLoad
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzComposeLoad() {
  try {
    include('chrome://jslib/content/io/file.js');
  }
  catch(ex) {
    //alert(getText("noJSlib"));
    window.haveJSlib = false;
    return;
  }
  tzAddedTagline = false;

  var compStateListener = new tzComposeStateListener();
  gMsgCompose.RegisterStateListener(compStateListener);

  var dlmgKey = document.getElementById("key_downloadManager");
  if (dlmgKey)
    dlmgKey.parentNode.removeChild(dlmgKey);

  //tzOverrideCommands(aWin);
}

function tzComposeReload() {
  if( !haveJSlib ) return;
  tzAddedTagline = false;
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
  tzDump("tzInsertTagline()\n");
  tzAddedTagline = true;    // assume success for the moment
  var cbSaver = new tzClipboardSaver();
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
        cbSaver.save();
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
        cbSaver.restore();
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
    ed.endTransaction();
    ed.undo(1);
    cbSaver.restore();
    tzAddedTagline = false;
    return false;
  }
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
    !tzAddedTagline ) {
    /*
    if(readMyPref(prefPrefix+".mailPick","bool",false)) {
      tzInsertTagline();
      eval(tzCmdActions[aCmd]);
    }
    else {
    */
      document.documentElement.setAttribute("tzPrefPrefix",prefPrefix); // hack, but it works
      tzCmd=aCmd;
      tagzillaWindow=toTagZilla(aCmd, tzPickedTagline);
      if (!tagzillaWindow)
      {
        tzAddedTagline = true;
        eval(tzCmdActions[aCmd]);
      }
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
  tzAddedTagline = true;
  eval(tzCmdActions[tzCmd]);
}

/*
 * The listeners that detect when the window is ready to be screwed with
 * ---------------------------------------------------------------------
 * This mechanism was observed in Enigmail (http://enigmail.mozdev.org).
 * My understanding of it is a bit shaky, but hey, it seems to work.
 * The first listener gets attached onload, and then it attaches the second,
 * which gets called when the document is editable.
 */

function tzComposeStateListener() {
}

tzComposeStateListener.prototype = {
  NotifyComposeFieldsReady : function() {
    tzDump("tzComposeStateListener.NotifyComposeFieldsReady()\n");
    try {
      tzEditorObj = gMsgCompose.editor.QueryInterface(Components.interfaces.nsIEditor);
    }
    catch(ex){}
    if( !tzEditorObj ) return;

    var docStateListener = new tzDocStateListener();
    tzEditorObj.addDocumentStateListener(docStateListener);
    tzOverrideCommands(window);
  },

  NotifyComposeBodyReady: function() {
  },

  ComposeProcessDone: function(aResult) {
  },

  SaveInFolderDone: function(folderURI) {
  }
};

function tzDocStateListener() {
}

tzDocStateListener.prototype = {
  QueryInterface: function (iid) {
    if (!iid.equals(Components.interfaces.nsIDocumentStateListener) &&
      !iid.equals(Components.interfaces.nsISupports))
    {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this;
  },

  NotifyDocumentStateChanged: function(nowDirty) {
    dump("tzDocStateListener.NotifyDocumentStateChanged("+nowDirty+"): ");
    var isEmpty = tzEditorObj.documentIsEmpty;
    var isEditable = tzEditorObj.isDocumentEditable;
    dump( (isEmpty?"empty":"not empty")+", "
      +(isEditable?"editable":"not editable")+"\n" );

    if( !isEditable )
      return;

    /* Don't add a tagline if there's one already added (eg, editing a
       draft) -- experimental!  May break if a tagline is quoted in a
       reply */
    if( !isEmpty && !tzAddedTagline ) {
      var msgBody;  // Message body for our perusal
      // indicators for detecting tagline
      var prefix = readMyPref("tagzilla.mail.prefix","string","");
      var suffix = readMyPref("tagzilla.mail.suffix","string","");

      if( window.GetCurrentEditor ) {
        var ed = window.GetCurrentEditor();
        /* 1026 = 2 (output formatted) | 1024 (LF linebreak)
           taken from enigmailMsgComposeOverlay.js */
        msgBody = ed.outputToString("text/plain", 1026);
      }
      /*
      else if(msgPane.editorShell) {
        // FIXME
      }
      */

      msgBody = msgBody.replace(/\n/g,"\\n");
      if( (prefix && msgBody.indexOf(prefix) >= 0 ) &&
          (suffix && msgBody.indexOf(suffix) >= 0 ) ) {
        tzDump( "tzDocStateListener detected previous tagline\n" );
        tzAddedTagline = true;
      }
    }

    if( !tzAddedTagline ) {
      var prefPrefix = "tagzilla."+gCurrentIdentity.key;
      if(readMyPref(prefPrefix+".mailAuto","bool",true) &&
        readMyPref(prefPrefix+".mailPick","bool",false)) {

        tzDump("tzDocStateListener inserting tagline\n");
        setTimeout(tzInsertTagline, 150);
      }
    }
  },

  NotifyDocumentCreated: function() {
  },

  NotifyDocumentWillBeDestroyed: function() {
  }
};

window.addEventListener("load",tzComposeLoad,false);
window.addEventListener("compose-window-reopen",tzComposeReload,true);

// EOF
