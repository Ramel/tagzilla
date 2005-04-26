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

////////////////////////////////////////////////////////////////////////////////
// Globals
////////////////////////////////////////////////////////////////////////////////

var tzuDEBUG = true;

var tzIsupports;
var tzIStr;
if(Components.classes["@mozilla.org/supports-wstring;1"]) {
  tzIsupports = "@mozilla.org/supports-wstring;1";
  tzIStr = Components.interfaces.nsISupportsWString;
}
else {
  tzIsupports = "@mozilla.org/supports-string;1";
  tzIStr = Components.interfaces.nsISupportsString;
}

var tzDump;
if(tzuDEBUG) {
  tzDump = function(aMsg) { dump(aMsg); };
}
else
{
  tzDump = function() { };
}

var tzConv = new ucConverter();

////////////////////////////////////////////////////////////////////////////////
// readMyPref
//
// Parameters:
//  prefIdentifier: a Mozilla pref string
//  prefType: a string identifying the type of the given pref string
//  defaultSetup: the desired "default" value of the given pref string
// Returns:
//  the value of the given pref, or defaultSetup on error
//
// The Initial Developer of this function is Henk-Johan van Rantwijk ("HJ").
// Copyright (C) 2001 to HJ.  Used here under the terms of the MPL.
// Check out his Mozilla project, MultiZilla: http://multizilla.mozdev.org
////////////////////////////////////////////////////////////////////////////////
function readMyPref( prefIdentifier, prefType, defaultSetup )
{
  var prefValue;
  var mvPreference = Components.classes[ "@mozilla.org/preferences-service;1" ]
                      .getService( Components.interfaces.nsIPrefBranch );

  tzDump( "readMyPref: "+prefType+" "+prefIdentifier+": " );
  switch( prefType )
  {
    case "bool":
      {
        try {
          prefValue = mvPreference.getBoolPref( prefIdentifier );
          tzDump( "got bool '"+prefValue+"'\n");
        }
        catch( ex ) {
          tzDump( "not set, writing default\n" );
          writePref( prefType, prefIdentifier, defaultSetup );
          return ( defaultSetup );
        }
        if ( prefValue || !prefValue )
          return ( prefValue );
        else return ( defaultSetup );
        break;
      }
    case "int":
      {
        try {
          prefValue = mvPreference.getIntPref( prefIdentifier );
          tzDump( "got int '"+prefValue+"'\n");
        }
        catch( ex ) {
          tzDump( "not set, writing default\n" );
          writePref( prefType, prefIdentifier, defaultSetup );
          return ( defaultSetup );
        }
        return ( prefValue );
        break;
      }
    case "string":
      {
        try {
          prefValue = mvPreference.getComplexValue( prefIdentifier,
                                   tzIStr );
          tzDump( "got string '"+prefValue+"'\n");
        }
        catch( ex ) {
          tzDump( "not set, writing default\n" );
          writePref( prefType, prefIdentifier, defaultSetup );
          return ( defaultSetup );
        }
        return prefValue.data.length ? prefValue.data : defaultSetup;
      }
    case "char":
      {
        try {
          prefValue = mvPreference.getCharPref( prefIdentifier );
          tzDump( "got char '"+prefValue+"'\n");
        }
        catch( ex ) {
          tzDump( "not set, writing default\n" );
          writePref( prefType, prefIdentifier, defaultSetup );
          return ( defaultSetup );
        }
        break;
      }
    case "url":
      {
        try {
          prefValue = mvPreference.getComplexValue( prefIdentifier,
            Components.interfaces.nsIPrefLocalizedString );
          tzDump( "got url '"+prefValue+"'\n");
        }
        catch( ex ) {
          tzDump( "not set, writing default\n" );
          writePref( prefType, prefIdentifier, defaultSetup );
          return ( defaultSetup );
        }
        return prefValue.data.length ? prefValue.data : defaultSetup;
      }
    default:
    {
      tzDump( "unsupported type\n" );
    }
  }
  return ( prefValue );
}
////////////////////////////////////////////////////////////////////////////////
// writePref
//
// Parameters:
//  prefType: a string describing the type of the pref to write
//  prefString: the name of the Mozilla pref to write
//  prefValue: the value to write into the given pref
// Returns:
//  Nothing
//
// The Initial Developer of this function is Henk-Johan van Rantwijk ("HJ").
// Copyright (C) 2001 to HJ.  Used here under the terms of the MPL.
// Check out his Mozilla project, MultiZilla: http://multizilla.mozdev.org
////////////////////////////////////////////////////////////////////////////////
function writePref( prefType, prefString, prefValue )
{
  var mvPreference = Components.classes[ "@mozilla.org/preferences-service;1" ]
                     .getService( Components.interfaces.nsIPrefBranch );

  tzDump( "writePref: "+prefType+" "+prefString+" '"+prefValue+"': " );
  try {
    switch ( prefType ) {
      case "bool":
        {
          if( !prefValue || String(prefValue).match(/^(false|no|off)$/i) ) {
            mvPreference.setBoolPref( prefString, false );
            tzDump( "wrote False\n" );
          }
          else {
            mvPreference.setBoolPref( prefString, true );
            tzDump( "wrote True\n" );
          }
          break;
        }
      case "int":
        {
          mvPreference.setIntPref( prefString, parseInt(prefValue) );
          tzDump( "wrote int '"+parseInt(prefValue)+"'\n" );
          break;
        }
      case "string":
        {
          var str = Components.classes[ tzIsupports ].createInstance(tzIStr);
          str.data = prefValue;
          mvPreference.setComplexValue( prefString, tzIStr, str );
          tzDump( "wrote string\n" );
          break;
        }
      case "url":
        {
          mvPreference.setComplexValue( prefIdentifier, Components.interfaces.nsIPrefLocalizedString, 
                                        prefValue );
          tzDump( "wrote url\n" );
          break;
        }
      case "char":
        {
          mvPreference.setCharPref( prefString, prefValue );
          tzDump( "wrote char\n" );
          break;
        }
      default:
        {
          tzDump( "unsupported type\n" );
        }
    }
  }
  catch ( ex ) { // die silently
    tzDump( "...\n" );
    dump("writePref:"+ex+"\n");
  }
}

////////////////////////////////////////////////////////////////////////////////
// getTextFromBundle
//
// Parameters:
//  aStr: name of bundled string to take from
//   chrome://tagzilla/locale/tagzilla.properties
// Returns:
//  the bundled string
////////////////////////////////////////////////////////////////////////////////
function getText(aStr) {
  var strBundleService =
      Components.classes["@mozilla.org/intl/stringbundle;1"].getService();
  strBundleService =
    strBundleService.QueryInterface(Components.interfaces.nsIStringBundleService);
  var tzBundle = strBundleService
       .createBundle("chrome://tagzilla/locale/tagzilla.properties");

  if(tzBundle) {
    try {
      return tzBundle.GetStringFromName( aStr );
    }
    catch(e) {}
  }
  return null;
}

////////////////////////////////////////////////////////////////////////////////
// txtFilePicker
//
// Parameters:
//  aTitle: title to go on file picker window
//  aSave: 1 if picking file to save/overwrite, 0 if picking file to load
//  aStart: directory to start from
//    This must be an nsILocalFile.  new Dir("foo") in jslib/io/dir.js will
//    do the trick, but you have to do it yourself.
// Returns:
//  Name of file picked, in path format, or null if cancelled
////////////////////////////////////////////////////////////////////////////////
function txtFilePicker(aTitle, aSave, aStart) {
  var retVal = null;
  try {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, aTitle, (aSave ? nsIFilePicker.modeSave : nsIFilePicker.modeOpen));
    fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);
    if(aStart) {
      fp.displayDirectory = aStart;
    }
    var result=fp.show();

    if (result == nsIFilePicker.returnOK || result == nsIFilePicker.returnReplace) {
      //retVal=fp.fileURL.spec;
      retVal=fp.file.path;
    }
  }
  catch (ex) {
  }
  return retVal;
}

////////////////////////////////////////////////////////////////////////////////
// openUrl
//
// Parameters:
//  aUrl: the URL to load
// Returns: nothing
//
// The Initial Developer of this function is R. Saravanan.
// Copyright (C) 2002 to R. Saravanan.  Used here under the terms of the MPL.
// Check out his Mozilla project, EnigMail: http://enigmail.mozdev.org
////////////////////////////////////////////////////////////////////////////////
function openUrl(aUrl) {
  var navWindow;

  // if this is a browser window, just use it
  if ("document" in top) {
    var possibleNavigator = top.document.getElementById("main-window");
    if (possibleNavigator &&
        possibleNavigator.getAttribute("windowtype") == "navigator:browser")
      navWindow = top;
  }

  // if not, get the most recently used browser window
  if (!navWindow) {
    try {
      var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
        .getService(Components.interfaces.nsIWindowMediator);
      navWindow = wm.getMostRecentWindow("navigator:browser");
    }
    catch (ex) { }
  }
  if (navWindow) {
    if ("delayedOpenTab" in navWindow)
      navWindow.delayedOpenTab(aUrl);
    else if ("loadURI" in navWindow)
      navWindow.loadURI(aUrl);
    else
      navWindow._content.location.href = aUrl;
  }
  // if all else fails, open a new window
  else {
    window.open(aUrl);
  }
}

////////////////////////////////////////////////////////////////////////////////
// tzSetEscCharset
//  Sets the character set to be used for tzEscape/tzUnescape
//
// Parameters: aSet: the character set string identifier (optional)
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzSetEscCharset(aSet){
  if( !aSet ) aSet = readMyPref("tagzilla.file.charset","string","UTF-8");
  tzConv.charset = aSet;
}
////////////////////////////////////////////////////////////////////////////////
// tzEscape
//  Escapes a string so it'll survive intact on disk
//
// Parameters: aStr: the string to be escaped
// Returns: the escaped string
////////////////////////////////////////////////////////////////////////////////
function tzEscape(aStr){
  return tzConv.fromUnicode(aStr);
}

////////////////////////////////////////////////////////////////////////////////
// tzUnescape
//  Unescapes a string encoded with tzEscape
//
// Parameters: aStr: the string to be unescaped
// Returns: the unescaped string
////////////////////////////////////////////////////////////////////////////////
function tzUnescape(aStr){
  return tzConv.toUnicode(aStr);
}

////////////////////////////////////////////////////////////////////////////////
// ucConverter -- a class to convert to/from unicode
//
// Based on MessageManager() from chatzilla, by Rob Ginda
// Used here under the terms of the GPL
//
// The name's a bit of a misnomer now, as it reads a pref to determine
// what charset (UTF-8 or other) to convert to/from
////////////////////////////////////////////////////////////////////////////////
function ucConverter()
{
  const UC_CTRID = "@mozilla.org/intl/scriptableunicodeconverter";
  const nsIUnicodeConverter =
    Components.interfaces.nsIScriptableUnicodeConverter;

  this.ucConverter =
      Components.classes[UC_CTRID].getService(nsIUnicodeConverter);
  this.defaultBundle = null;
  this.bundleList = new Array();
  this.charset = readMyPref("tagzilla.file.charset","string","UTF-8");

  this.toUnicode = function (msg) {
    try
    {
      this.ucConverter.charset = this.charset;
      msg = this.ucConverter.ConvertToUnicode(msg);
    }
    catch (ex)
    {
      tzDump ("caught exception " + ex + " converting '" + msg
        + "' to charset " + this.charset);
    }

    return msg;
  };

  this.fromUnicode = function (msg) {
    if (this.charset != this.ucConverter.charset)
      this.ucConverter.charset = this.charset;

    try
    {
      if ("Finish" in this.ucConverter)
      {
        msg = this.ucConverter.ConvertFromUnicode(msg);
        this.ucConverter.Finish();
      }
      else
      {
        msg = this.ucConverter.ConvertFromUnicode(msg + " ");
        msg = msg.substr(0, msg.length - 1);
      }
    }
    catch (ex)
    {
      tzDump ("caught exception " + ex + " converting '" + msg
        + "' to charset " + this.charset);
    }

    return msg;
  };
}

/*
 * ClipboardSaver
 * --------------
 * Some selection manipulation can destroy the X11 selection clipboard.
 * This saves and restores it.
 */

function tzClipboardSaver() {
  this.dataStack = new Array();
  this.clipBoard = Components.classes["@mozilla.org/widget/clipboard;1"]
    .getService(Components.interfaces.nsIClipboard);
  this.needed = this.clipBoard.supportsSelectionClipboard();
}

tzClipboardSaver.prototype = {
  save: function()
  {
    if( !this.needed ) return;
    try
    {
      var transferable = Components.classes["@mozilla.org/widget/transferable;1"]
        .createInstance(Components.interfaces.nsITransferable);
      transferable.addDataFlavor("text/unicode");
      this.clipBoard.getData(transferable, this.clipBoard.kSelectionClipboard);
      var flavour = {};
      var data = {};
      var length = {};
      transferable.getAnyTransferData(flavour, data, length);
      this.dataStack.push(data);
    }
    catch(ex) { }
  },
  restore: function()
  {
    if( !this.needed ) return;
    try
    {
      var data = this.dataStack.pop();
      var pasteClipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
        .getService(Components.interfaces.nsIClipboardHelper);
      data = data.value.QueryInterface(Components.interfaces.nsISupportsString).data;
      pasteClipboard.copyStringToClipboard(data, this.clipBoard.kSelectionClipboard);
    }
    catch(ex) { }
  }
};


function tzDumpObj( aObj, objName )
{
  if(!tzuDEBUG) return;
  if( !objName ) objName = "object";
  tzDump( "--- "+objName+" dump start ---\n" );
  for( var i in aObj )
    if( typeof aObj[i] == "function" )
      tzDump( i+"("+aObj[i].arity+" args)\n" );
    else
      tzDump( i+":"+aObj[i]+"\n" );
  tzDump( "--- "+objName+" dump end ---\n" );
}


tzDump( "tagzilla/utility.js loaded\n" );
