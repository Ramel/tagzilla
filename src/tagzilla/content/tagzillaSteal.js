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
 * The Original Code in this file was released on October 19, 2002
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
var tagline;  // textbox holding the stolen tagline
var tagFile;  // textbox holding the name of the file to save to

////////////////////////////////////////////////////////////////////////////////
// OnLoad
//
// Parameters: tagline to steal (via arguments[0])
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function OnLoad() {
  try {
    include('chrome://jslib/content/io/file.js');
    include('chrome://jslib/content/io/dir.js');
    //include('chrome://jslib/content/io/fileUtils.js');
  }
  catch(ex) {
    alert(getText("noJSlib"));
    window.close();
    return;
  }

  tagline = document.getElementById("tagline");
  tagline.value = window.arguments[0];
  tagline.value = tagline.value.replace(/\n\n/g,"\n");
/*
  if(readMyPref("tagzilla.newline.convert","bool",true)) {
    tagline.value = tagline.value.replace(/\n/g,"\\n");
    tagline.value = tagline.value.replace(/\\n\\n/g,"\\n");
  }
  else {
    tagline.value = tagline.value.replace(/\n/g," ");
  }
*/
  tagFile=document.getElementById("filename");
  tagFile.value=readMyPref("tagzilla.default.file","string","");
  sizeToContent();
  tagline.focus();
}

////////////////////////////////////////////////////////////////////////////////
// chooseFile()
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function chooseFile() {
  var oldDir = tagFile.value;
  var newDir = null;
  oldDir = oldDir.substring(0,oldDir.lastIndexOf("/")+1);
  if(oldDir) {
    newDir = new Dir(oldDir);
  }
  var fName = txtFilePicker(getText("chooseFile"),0,newDir);
  if(fName!=null) {
    tagFile.value=fName;
//    var fUtils = new FileUtils();
//    tagFile.value=fUtils.urlToPath(fName);
  }
}

////////////////////////////////////////////////////////////////////////////////
// doSteal()
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function doSteal() {
  try {
    var f = new File(tagFile.value);
    var oldFile = "";
    /*
     * Ideally, this would work:
     *  f.open("a");
     *  f.write(tagline.value);
     *  f.close();
     * Unfortunately, f.open("a") and f.open("w") seem to behave the same.
     * Hence the read/write we do here.
     * It's probably very slow for long files, but it's better than wiping them out.
     */
    if(f.exists()) {
      f.open();
      oldFile=f.read();
      f.close();
    }
    var delim=readMyPref("tagzilla.multiline.delimiter","string","%");
    if(delim!="" && readMyPref("tagzilla.multiline.file","bool",false)) {
      oldFile += "\n"+delim+"\n"+tagline.value+"\n";
    }
    else {
      oldFile += tagline.value+"\n";
    }
    f.open("w");
    f.write(oldFile);
    f.close();
  }
  catch (ex) {
    dump("doSteal: "+ex+"\n");
  }
  window.close();
}
