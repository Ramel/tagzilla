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
 * The Original Code in this file was released on July 16, 2002
 * 
 * Unless otherwise stated, the Initial Developer of the
 * Original Code is David Perry.  Portions created by David Perry are
 * Copyright (C) 2002 David Perry.  All rights reserved.
 * 
 * Contributor(s):
 *   David Perry <d.perry@utoronto.ca> (Original Author)
 * 
 */

////////////////////////////////////////////////////////////////////////////////
// Global Variables
////////////////////////////////////////////////////////////////////////////////
var lBox;       // the listbox element
var textBox;    // the entry textbox
var addButton;  // the Add button
var modButton;  // the Modify button
var delButton;  // the Delete button
var insButton;  // the Insert (and close) button

var tzBundle;   // string bundle
var tzCmd;      // command
var tzDoc;      // window's calling document


////////////////////////////////////////////////////////////////////////////////
// tzOnLoad
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzOnLoad() {
  lBox      = document.getElementById("tzListBox");
  textBox   = document.getElementById("tagline");
  addButton = document.getElementById("tzAdd");
  modButton = document.getElementById("tzModify");
  delButton = document.getElementById("tzDel");
  insButton = document.getElementById("insert-button");

  tzCmd = window.arguments[0];
  tzDoc = window.arguments[1];

  // String bundle code taken from chrome://editor/content/editorUtilities.js
  // Used under terms of the NPL
  try {
    var strBundleService =
        Components.classes["@mozilla.org/intl/stringbundle;1"].getService();  
    strBundleService =
          strBundleService.QueryInterface(Components.interfaces.nsIStringBundleService);
  
    tzBundle = strBundleService.createBundle("chrome://tagzilla/locale/tagzilla.properties");
  }
  catch(e) {}

  if(tzCmd=="TZ_CLIPBOARD") {
    insButton.setAttribute("label",getText("clipboardLabel"));
  }

  include('chrome://jslib/content/io/file.js');
  include('chrome://jslib/content/io/fileUtils.js');

  var tFile = readMyPref("tagzilla.default.file","string","");
  if(tFile == "") {
    loadList();
  }
  else {
    if(loadTaglineFile(tFile)==-1)
      loadList();
    else
      setTimeout(tzOnSel,10);
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
  
  if(tzCmd=="TZ_MAIL" || tzCmd.substring(0,8)=='cmd_send') {
    var prefix = readMyPref("tagzilla.mail.prefix","string","").replace(/\\n/g,"\n");
    var suffix = readMyPref("tagzilla.mail.suffix","string","").replace(/\\n/g,"\n");

    var msgPane = tzDoc.getElementById("content-frame");
    if(msgPane) {
      var controller = tzDoc.commandDispatcher.getControllerForCommand('cmd_moveBottom');
      controller.doCommand('cmd_moveBottom');
      msgPane.editorShell.InsertText(prefix+selTagline+suffix);
      setTimeout(tzExit, 10);
    }
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
      var tagString = Components.classes["@mozilla.org/supports-wstring;1"]
                               .createInstance(Components.interfaces.nsISupportsWString);

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
    writePref("string", "tagzilla.default.file",
      document.getElementById("tzListHead").getAttribute("label"));
  }
  window.close();
}

////////////////////////////////////////////////////////////////////////////////
// tzOnSel
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzOnSel() {
  if(lBox.selectedCount > 1) {
    textBox.setAttribute("disabled",true);
    disableButton(addButton,true);
    disableButton(modButton,true);
    disableButton(delButton,false);
  }
  else {
    textBox.removeAttribute("disabled");
    textBox.focus();

    if(lBox.selectedCount == 1) {
      textBox.value=lBox.getSelectedItem(0).firstChild.getAttribute("label");
      disableButton(addButton,false);
      disableButton(modButton,false);
      disableButton(delButton,false);
    }
    else {
      disableButton(addButton,true);
      disableButton(delButton,true);
      disableButton(modButton,true);
    }
  }
  taglineChanged(false);
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
  while(!f.EOF) {
    addTagline(f.readline());
  }
  lBox.setAttribute("changed","false");

  return 0;
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
  disableButton(modButton,textBox.value=="" || lBox.selectedCount!=1);
  disableButton(addButton,textBox.value=="");
  insButton.setAttribute("disabled",false);
}

////////////////////////////////////////////////////////////////////////////////
// addTagline
//
// Parameters:
//  aTagline: the tagline to add to the listbox
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function addTagline(aTagline) {
  if(aTagline) {
    var aCell = document.createElement("listcell");
    var aItem = document.createElement("listitem");
    aCell.setAttribute("label", aTagline);
    aItem.appendChild(aCell);
    lBox.appendChild(aItem);
    taglineChanged(false);
    lBox.setAttribute("changed","true");
  }
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
    if(lBox.currentItem) {
      taglineChanged(false);
      lBox.getSelectedItem(0).firstChild.setAttribute("label",aTagline);
      lBox.ensureElementIsVisible(lBox.currentItem);
    }
    else
      addTagline(aTagline);

    lBox.setAttribute("changed","true");
  }
}

////////////////////////////////////////////////////////////////////////////////
// delTaglines
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function delTaglines() {
  if(!lBox.selectedCount)
    return;

  for(var i=lBox.selectedCount;i>0;i--) {
    var iItem=lBox.getSelectedItem(i-1);
    lBox.removeChild(iItem);
  }
  lBox.setAttribute("changed","true");
}

////////////////////////////////////////////////////////////////////////////////
// sortList
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function sortList() {
  for(var i=1; i<=lBox.getRowCount(); i++) {
    for(var j=1; j<=i; j++) {
      var iTag = lBox.childNodes[i].firstChild;
      var jTag = lBox.childNodes[j].firstChild;
      if(iTag.getAttribute("label") < jTag.getAttribute("label")) {
        var t=iTag.getAttribute("label");
        iTag.setAttribute("label", jTag.getAttribute("label"));
        jTag.setAttribute("label",t);
      }
    }
  }
  lBox.setAttribute("changed","true");
}

////////////////////////////////////////////////////////////////////////////////
// clearList
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function clearList() {
  while(lBox.childNodes.length > 1) {
    lBox.removeChild(lBox.lastChild);
  }
  document.getElementById("tzListHead").setAttribute("label","");
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
  var notSaved=notSavedDlg();
  if(notSaved==1) return false;                 // cancel
  if(notSaved==0 && !saveList()) return false;  // save
  try {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, getText("loadFile"), nsIFilePicker.modeOpen);
    fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

    if (fp.show() == nsIFilePicker.returnOK) {
      clearList();
      loadTaglineFile(fp.fileURL.spec);
    }
    else
      return false;
  } catch (ex) {
  }
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
  try {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, getText("saveFile"), nsIFilePicker.modeSave);
    fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);
    var result=fp.show();

    if (result == nsIFilePicker.returnOK || result == nsIFilePicker.returnReplace) {
      var fUtils = new FileUtils();
      var f = new File(fUtils.urlToPath(fp.fileURL.spec));
      if(!f.open("w")) {
        alert(getText("saveErrMsg"));
        return false;
      }
      for(var i=1; i<=lBox.getRowCount(); i++) {
        f.write(lBox.childNodes[i].firstChild.getAttribute("label")+"\n");
      }
      f.close();

      lBox.setAttribute("changed","false");
    }
    else
      return false;
  } catch (ex) {
  }
  return true;
}

////////////////////////////////////////////////////////////////////////////////
// selRandTagline
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function selRandTagline() {
  var rv=parseInt(Math.round(Math.random() * (lBox.getRowCount()-1)+1));
  lBox.ensureElementIsVisible(lBox.childNodes[rv]);
  lBox.selectItem(lBox.childNodes[rv]);
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
  if(aBut && (aBut==addButton || aBut==delButton || aBut==modButton)) {
    if(aDis) {
      aBut.setAttribute("disabled","true");
      aBut.firstChild.selectedIndex=1;
    }
    else {
      aBut.setAttribute("disabled","false");
      aBut.firstChild.selectedIndex=0;
    }
  }
  return;
}
