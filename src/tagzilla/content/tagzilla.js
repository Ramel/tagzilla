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
var lBox;       // the listbox element (now it's actually a tree)
var textBox;    // the entry textbox
var addButton;  // the Add button
var modButton;  // the Modify button
var delButton;  // the Delete button
var insButton;  // the Insert (and close) button

var tzCmd;      // command
var tzDoc;      // window's calling document
var tzWin;      // window's calling window

var tzList = []; // the actual tagline list
var tzNL = "\n"; // newline flavour of the current file (defaults to unix)

var tzCallback;  // callback function from opener

////////////////////////////////////////////////////////////////////////////////
// tzTreeView object
//
// the view generator for the tree
////////////////////////////////////////////////////////////////////////////////
var tzTreeView = {
  rowCount : 0,
  getCellText : function(row, col) {
    var tzCol = col;
    if ("nsITreeColumn" in Components.interfaces)
      tzCol = col.id;
    if(tzCol=="tzListHead") {
      if(tzList[row].indexOf("\n") >= 0) {
        return tzList[row].substring(0,tzList[row].indexOf("\n"));
      }
      return tzList[row];
    }
    else if(tzCol=="tzMultiLine") {
      if(tzList[row].indexOf("\n") >= 0) {
        return ">>";
      }
      return "";
    }
  },
  isContainer: function(row) {
    return false;
  },
  setTree: function(treebox) {},
  getImageSrc : function(row,column) {},
  getProgressMode : function(row,column) {},
  getCellValue : function(row,column) {},
  isSeparator : function(index) {return false;},
  isSorted: function() { return false; },
  isContainer : function(index) {return false;},
  cycleHeader : function(aColId, aElt) {},
  getRowProperties : function(row,column,prop){},
  getColumnProperties : function(column,columnElement,prop){},
  getCellProperties : function(row,prop){}
};


////////////////////////////////////////////////////////////////////////////////
// tzOnLoad
//
// Parameters: (passed in through window.arguments)
//  tzCmd: text string indicating how TagZilla is to be used
//  tzDoc: TagZilla's calling document or object
//
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzOnLoad() {
  try {
    include('chrome://jslib/content/io/file.js');
    include('chrome://jslib/content/io/dir.js');
    include('chrome://jslib/content/io/fileUtils.js');
  }
  catch(ex) {
    alert(getText("noJSlib"));
    window.close();
    return;
  }

  lBox      = document.getElementById("tzListBox");
  textBox   = document.getElementById("tagline");
  addButton = document.getElementById("tzAdd");
  modButton = document.getElementById("tzModify");
  delButton = document.getElementById("tzDel");
  insButton = document.getElementById("insert-button");

  lBox.view = tzTreeView;

  tzCmd = window.arguments[0];
  if(window.arguments[1].tagName == 'TEXTAREA') {
    tzDoc = window.arguments[1];
  }
  else {
    tzWin = window.arguments[1];
    tzDoc = tzWin.document;
  }
  if (window.arguments.length > 2 &&
      typeof window.arguments[2] == "function") {
      tzCallback = window.arguments[2];
  }

  //tzList = new Array();

  if(tzCmd=="TZ_CLIPBOARD") {
    insButton.setAttribute("label",getText("clipboardLabel"));
  }

  var tFile = "";
  if(tzCmd=="TZ_MAIL" || tzCmd.substring(0,8)=='cmd_send') {
    var prefPrefix = tzDoc.documentElement.getAttribute("tzPrefPrefix");
    tFile = readMyPref(prefPrefix+".mailFile","string","");
  }
  if(tFile == "") {
    tFile = readMyPref("tagzilla.default.file","string","");
  }
  if(tFile == "") {
    loadList();
  }
  else {
    if(loadTaglineFile(tFile)==-1)
      loadList();
    else {
      tzRefresh();
      selRandTagline();
      textBox.select();
      //setTimeout(tzOnSel,10);
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
// tzInsert
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzInsert() {
  var selTagline = textBox.value;

  if(selTagline=='') {
    selRandTagline();
    selTagline = textBox.value;
  }

  if(readMyPref("tagzilla.newline.convert","bool",true)) {
    selTagline = selTagline.replace(/\\n/g,"\n");
  }

  if(tzCmd=="TZ_MAIL" || tzCmd.substring(0,8)=='cmd_send') {
    var prefix = readMyPref("tagzilla.mail.prefix","string","").replace(/\\n/g,"\n");
    var suffix = readMyPref("tagzilla.mail.suffix","string","").replace(/\\n/g,"\n");

    var msgPane = tzDoc.getElementById("content-frame");
    if(msgPane) {
      var tzAddedTagline = true;
      var controller = tzDoc.commandDispatcher.getControllerForCommand('cmd_moveBottom');
      if(controller) {
        controller.doCommand('cmd_moveBottom');
      }
      if(msgPane.editorShell) {
        msgPane.editorShell.InsertText(prefix+selTagline+suffix);
      }
      else if(tzWin.GetCurrentEditor)
      {
        var ed = tzWin.GetCurrentEditor();
        ed.endOfDocument();
        ed.insertText(prefix+selTagline+suffix);
      }
      else {
        alert("I'm afraid I don't know how to insert taglines in this version\n"+
              "of Mozilla. File a bug on it, and use Clipboard Mode in the meantime.");
        tzAddedTagline = false;
      }
      if(tzWin && tzAddedTagline) {
        tzWin.tzAddedTagline = true;
      }
      setTimeout(tzExit, 10);
    }
  }
  else if(tzCmd=="TZ_TEXTBOX") {
    var prefix = readMyPref("tagzilla.clipboard.prefix","string","").replace(/\\n/g,"\n");
    var suffix = readMyPref("tagzilla.clipboard.suffix","string","").replace(/\\n/g,"\n");
    var textToAdd = prefix+selTagline+suffix;
    tzDoc.value += textToAdd;
    setTimeout(tzExit, 10);
  }
  else if(tzCmd=="TZ_CLIPBOARD") {
    try {
      var prefix = readMyPref("tagzilla.clipboard.prefix","string","").replace(/\\n/g,"\n");
      var suffix = readMyPref("tagzilla.clipboard.suffix","string","").replace(/\\n/g,"\n");
      var textToAdd = prefix+selTagline+suffix;

      var clipboard = Components.classes[ "@mozilla.org/widget/clipboard;1" ]
                                .getService(Components.interfaces.nsIClipboard);

      var trans = Components.classes[ "@mozilla.org/widget/transferable;1" ]
                            .createInstance(Components.interfaces.nsITransferable);
      var tagString = Components.classes["@mozilla.org/supports-string;1"]
                               .createInstance(Components.interfaces.nsISupportsString);

      trans.addDataFlavor( "text/unicode" );
      tagString.data=textToAdd;
      trans.setTransferData("text/unicode",tagString,textToAdd.length*2);
      clipboard.setData(trans, null, Components.interfaces.nsIClipboard.kGlobalClipboard);

    } catch ( ex ) {
      alert(ex);
    }
    setTimeout(tzExit, 10);

  }
  else
    tzExit();
}

////////////////////////////////////////////////////////////////////////////////
// tzExit
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzExit() {
  var notSaved=notSavedDlg();
  if(notSaved==1) return false;                 // cancel
  if(notSaved==0 && !saveList()) return false;  // save

  if(readMyPref("tagzilla.default.autosave","bool",true)) {
    if(tzCmd=="TZ_MAIL" || tzCmd.substring(0,8)=='cmd_send') {
      var prefPrefix = tzDoc.documentElement.getAttribute("tzPrefPrefix");
      // only overwrite the pref it it's not blank (meaning use the default)
      if(readMyPref(prefPrefix+".mailFile","string","")=="") {
        writePref("string", "tagzilla.default.file",
          document.getElementById("tzListHead").getAttribute("label"));
      }
      else {
        writePref("string", prefPrefix+".mailFile",
          document.getElementById("tzListHead").getAttribute("label"));
      }
    }
    else {
      writePref("string", "tagzilla.default.file",
        document.getElementById("tzListHead").getAttribute("label"));
    }
  }
  if (tzCallback) {
    tzCallback();
  }
  window.close();
}

////////////////////////////////////////////////////////////////////////////////
// tzNumSelected
//
// Parameters: none
// Returns:
//  0 if there is no selected tagline
//  1 if there is exactly one selected tagline
//  2 if more than one tagline is selected
////////////////////////////////////////////////////////////////////////////////
function tzNumSelected() {
  if(lBox.currentIndex == -1) {
    return 0;
  }
  var numRanges = lBox.treeBoxObject.view.selection.getRangeCount();
  if(numRanges > 1) {
    return 2;
  }
  var start = new Object();
  var end = new Object();
  lBox.treeBoxObject.view.selection.getRangeAt(0,start,end);
  var numSelected = end.value-start.value+1;
  return (numSelected > 1 ? 2 : numSelected);
}

////////////////////////////////////////////////////////////////////////////////
// tzOnSel
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzOnSel() {
  var selectedCount = tzNumSelected();
  if(selectedCount > 1) {
    textBox.setAttribute("disabled",true);
    disableButton(addButton,true);
    disableButton(modButton,true);
    disableButton(delButton,false);
  }
  else {
    textBox.removeAttribute("disabled");
    if(selectedCount == 1) {
      textBox.value=tzList[lBox.currentIndex];
      disableButton(addButton,false);
      disableButton(modButton,false);
      disableButton(delButton,false);
    }
    else {
      disableButton(addButton,true);
      disableButton(delButton,true);
      disableButton(modButton,true);
    }
    textBox.focus();
  }
  taglineChanged(false);
  tzRefresh();
}

////////////////////////////////////////////////////////////////////////////////
// loadTaglineFile
//  loads the given file and displays it in the listbox
//
// Parameters:
//  aUrl: string name of file to open in file:// format
//
// Returns:
//  -1 if file doesn't exist
////////////////////////////////////////////////////////////////////////////////
function loadTaglineFile(aUrl) {

  var aFile=aUrl;
  if(aUrl.substring(0,4)=="file") {
    var fUtils = new FileUtils();
    aFile = fUtils.urlToPath(aUrl);
  }
  var f = new File(aFile);
  var lTitle = document.getElementById("tzListHead");

  if(!f.exists()) {
    alert(getText("notFoundMsg"));
    return -1;
  }

  lTitle.setAttribute("label",aFile);

  f.open("r");
  var fContents = f.read();
  f.close();

  // Determine the newline flavour. unix is \n, mac is \r, dos is \r\n
  // (If we can't figure it out, stick with the old value)
  tzNL = fContents.match(/\r?\n|\r\n?/) || tzNL;

  // use \n internally
  var nlRE = new RegExp(tzNL, "g");
  fContents = fContents.replace(nlRE, "\n");

  var delim="\n"+readMyPref("tagzilla.multiline.delimiter","string","%")+"\n";
  if(delim!="\n\n" && fContents.indexOf(delim)>=0) {
    tzList = fContents.split(delim);
  }
  else {
    tzList = fContents.split("\n");
    if(tzList[tzList.length-1]=="")
      tzList.pop();
  }
  tzSetEscCharset();
  for(var i=0; i<tzList.length; i++) {
    tzList[i] = tzUnescape(tzList[i]);
  }
  tzTreeView.rowCount = tzList.length;
  lBox.setAttribute("changed","false");
  lBox.treeBoxObject.view.selection.select(-1);
  tzRefresh();

  return 0;
}

////////////////////////////////////////////////////////////////////////////////
// saveTaglineFile
//
// Parameters:
//  aUrl: string name of file to open, in platform-specific or file:// format
//
// Returns: true if list saved, false otherwise
////////////////////////////////////////////////////////////////////////////////
function saveTaglineFile(aUrl) {

  var aFile=aUrl;
  if(aUrl.substring(0,4)=="file") {
    var fUtils = new FileUtils();
    aFile = fUtils.urlToPath(aUrl);
  }

  var f = new File(aFile);
  var rv = f.open("w");
  if( (JS_LIB_VERSION >= "0.1.187" && rv != JS_LIB_OK ) ||
      (JS_LIB_VERSION < "0.1.187" && !rv) ) {
    alert(getText("saveErrMsg"));
    return false;
  }
  tzSetEscCharset();
  var scratchList = new Array();
  for(var i=0; i<tzList.length; i++) {
    scratchList[i] = tzEscape(tzList[i]);
  }
  var delim=readMyPref("tagzilla.multiline.delimiter","string","%");
  if(delim!="" && readMyPref("tagzilla.multiline.file","bool",false)) {
    f.write(scratchList.join(tzNL+delim+tzNL));
  }
  else {
    f.write(scratchList.join(tzNL)+tzNL);
  }
  f.close();

  lBox.setAttribute("changed","false");
  return true;
}

////////////////////////////////////////////////////////////////////////////////
// taglineChanged
//
// Parameters:
//  aChg: true if tagline is changed, false if it's pristine
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function taglineChanged(aChg) {
  textBox.setAttribute("changed",aChg);
  disableButton(modButton,textBox.value=="" || tzNumSelected()!=1);
  disableButton(addButton,textBox.value=="");
  insButton.setAttribute("disabled",false);
}

////////////////////////////////////////////////////////////////////////////////
// tzRefresh
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzRefresh() {
  lBox.view = tzTreeView;
}

////////////////////////////////////////////////////////////////////////////////
// showTagline
//
// Parameters:
//  aIndex: index of tagline to make visible
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function showTagline(aIndex) {
  var tbo = lBox.treeBoxObject;
  if(aIndex >= 0)
    tbo.ensureRowIsVisible(aIndex);
}

////////////////////////////////////////////////////////////////////////////////
// addTagline
//
// Parameters:
//  aTagline: the tagline to add to the listbox
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function addTagline(aTagline, aShow) {
  if(!aTagline) {
    return;
  }
  tzList.push(aTagline);
  tzTreeView.rowCount++;
  lBox.treeBoxObject.rowCountChanged(0,tzList.length);
  taglineChanged(false);
  lBox.setAttribute("changed","true");

  if(aShow) {
    lBox.treeBoxObject.view.selection.select(tzList.length-1);
    showTagline(tzList.length);
  }
  tzRefresh();
}

////////////////////////////////////////////////////////////////////////////////
// changeTagline
//
// Parameters:
//  aTagline: the tagline which will replace the currently selected tagline
//   in the listbox
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function changeTagline(aTagline) {
  if(aTagline) {
    if(tzNumSelected() == 1) {
      showTagline(lBox.currentIndex);
      lBox.treeBoxObject.view.selection.select(lBox.currentIndex);
      tzList[lBox.currentIndex]=textBox.value;
      taglineChanged(false);
    }
    else
      addTagline(aTagline);

    lBox.setAttribute("changed","true");
    tzRefresh();
  }
}

////////////////////////////////////////////////////////////////////////////////
// delTaglines
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function delTaglines() {
  if(tzNumSelected() == 0)
    return;

  var numRanges = lBox.treeBoxObject.view.selection.getRangeCount();
  var start = new Object();
  var end = new Object();
  var selIndexes = new Array();

  for(var i=numRanges-1; i>=0; i--) {
    lBox.treeBoxObject.view.selection.getRangeAt(i,start,end);
    tzList.splice(start.value,end.value-start.value+1);
  }
  showTagline();
  lBox.treeBoxObject.view.selection.select(-1);
  tzTreeView.rowCount = tzList.length;
  lBox.setAttribute("changed","true");
  tzRefresh();
}

////////////////////////////////////////////////////////////////////////////////
// sortList
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function sortList() {
  /* the Array() object has its own sort method, which is quite fast,
   * so there's no need for us to write our own sort function
   * like I did in prior versions.
   */

  window.setCursor("wait");
  tzList.sort();
  window.setCursor("auto");
  lBox.setAttribute("changed","true");
  tzRefresh();
}

////////////////////////////////////////////////////////////////////////////////
// clearList
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function clearList() {
  tzList = [];
  tzTreeView.rowCount = 0;
  document.getElementById("tzListHead").setAttribute("label","");
  tzRefresh();
}

////////////////////////////////////////////////////////////////////////////////
// notSavedDlg
//
// Parameters: none
// Returns:
//  0 if user wishes to save the modified list
//  1 if user presses cancel
//  2 if user does not wish to save (or if list isn't modified)
////////////////////////////////////////////////////////////////////////////////
function notSavedDlg() {
  if(lBox.getAttribute("changed")=="true") {
    var promptService = Components.classes[ "@mozilla.org/embedcomp/prompt-service;1" ].
                        getService(Components.interfaces.nsIPromptService);
    var promptFlags = promptService.BUTTON_TITLE_CANCEL * promptService.BUTTON_POS_1;
    promptFlags += promptService.BUTTON_TITLE_SAVE * promptService.BUTTON_POS_0;
    promptFlags += promptService.BUTTON_TITLE_DONT_SAVE * promptService.BUTTON_POS_2;

    var retVal = promptService.confirmEx( window,getText("notSavedHdr"),
       getText("notSavedMsg"), promptFlags,
       "button1", "button2", "button3", null, {value:0});
    return retVal;
  }
  else
    return 2;
}

////////////////////////////////////////////////////////////////////////////////
// loadList
//
// Parameters: none
// Returns: false if list not loaded, true otherwise
////////////////////////////////////////////////////////////////////////////////
function loadList() {
  var notSaved = notSavedDlg();
  if(notSaved==1) return false;                 // cancel
  if(notSaved==0 && !saveList()) return false;  // save

  var oldDir = document.getElementById("tzListHead").getAttribute("label");
  var newDir = null;
  oldDir = oldDir.substring(0,oldDir.lastIndexOf("/")+1);
  if(oldDir) {
    newDir = new Dir(oldDir);
  }

  var fName=txtFilePicker(getText("loadFile"),0,newDir);
  if(fName==null)
    return false;

  clearList();
  loadTaglineFile(fName);
  setTimeout(tzOnSel,10);
  return true;
}

////////////////////////////////////////////////////////////////////////////////
// saveList
//
// Parameters: none
// Returns: true if list saved, false otherwise
////////////////////////////////////////////////////////////////////////////////
function saveList() {
  var fName = document.getElementById("tzListHead").getAttribute("label");
  if(fName==null)
    return false;
  
  var isSaved = saveTaglineFile(fName);

  if(isSaved)
    lBox.setAttribute("changed","false");

  return isSaved;
}

////////////////////////////////////////////////////////////////////////////////
// saveListAs
//
// Parameters: none
// Returns: true if list saved, false otherwise
////////////////////////////////////////////////////////////////////////////////
function saveListAs() {
  var oldDir = document.getElementById("tzListHead").getAttribute("label");
  var newDir = null;
  oldDir = oldDir.substring(0,oldDir.lastIndexOf("/")+1);
  if(oldDir) {
    newDir = new Dir(oldDir);
  }
  var fName = txtFilePicker(getText("saveFile"),1,newDir);
  if(fName==null)
    return false;
  
  var isSaved = saveTaglineFile(fName);

  if(isSaved)
    lBox.setAttribute("changed","false");

  return isSaved;
}

////////////////////////////////////////////////////////////////////////////////
// selRandTagline
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function selRandTagline() {
  var rv=parseInt(Math.round(Math.random() * (tzList.length-1)));
  lBox.treeBoxObject.view.selection.select(rv);
  showTagline(rv);
}

////////////////////////////////////////////////////////////////////////////////
// showAboutDialog
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function showAboutDialog() {
  window.openDialog("chrome://tagzilla/content/about.xul",
    getText("about"),
    "chrome,resizable");
}

////////////////////////////////////////////////////////////////////////////////
// disableButton
//
// Parameters:
//  aBut: button to disable
//  aDis: true if disabling, false if enabling
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function disableButton(aBut, aDis) {
  if( aBut )
    if( aDis )
      aBut.setAttribute( "disabled", "true" );
    else
      aBut.removeAttribute( "disabled" );
  return;
}
