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
var tagline;  // textbox holding the stolen tagline
var tagFile;  // textbox holding the name of the file to save to

////////////////////////////////////////////////////////////////////////////////
// OnLoad
//
// Parameters: tagline to steal (via arguments[0])
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function OnLoad() {
  include('chrome://jslib/content/io/file.js');
  include('chrome://jslib/content/io/fileUtils.js');

  tagline=document.getElementById("tagline");
  tagline.value=window.arguments[0];

  tagFile=document.getElementById("filename");
  tagFile.value=readMyPref("tagzilla.default.file","string","");
  sizeToContent();
}

////////////////////////////////////////////////////////////////////////////////
// chooseFile()
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function chooseFile() {
  var fName = txtFilePicker(getText("chooseFile"),0);
  if(fName!=null) {
    var fUtils = new FileUtils();
    tagFile.value=fUtils.urlToPath(fName);
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
    oldFile += tagline.value+"\n";
    f.open("w");
    f.write(oldFile);
    f.close();
  }
  catch (ex) {
    dump("doSteal: "+ex+"\n");
  }
  window.close();
}
