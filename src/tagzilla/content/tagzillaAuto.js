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
 * The Original Code in this file was released on September 7, 2002
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
// tzRandTaglineFromFile
//
// Parameters:
//  aUrl: file to read a tagline from, in file:// or platform format
//
// Returns: a tagline, or null if there was a problem
////////////////////////////////////////////////////////////////////////////////
function tzRandTaglineFromFile(aUrl) {
  if(!aUrl || aUrl=="") {
    alert(getText("noAuto"));
    return null;
  }

  try {
    include('chrome://jslib/content/io/file.js');
    include('chrome://jslib/content/io/fileUtils.js');
  }
  catch(ex) {
    alert(getText("noJSlib"));
    return null;
  }

  var aFile=aUrl;
  if(aUrl.substring(0,7)=="file://") {
    var fUtils = new FileUtils();
    aFile = fUtils.urlToPath(aUrl);
  }
  var f = new File(aFile);
  
  try {
    f.open("r");
    var arr = f.read().split("\n");
    f.close();
    if(arr[arr.length-1]=="") {
      arr.pop();
    }

    var rv=parseInt(Math.round(Math.random() * arr.length));
    var tag=arr[rv];
    if(readMyPref("tagzilla.newline.convert","bool",true)) {
      tag = tag.replace(/\\n/g,"\n");
    }
    return tag;
  }
  catch(ex) {
    alert(getText("cantRead"));
    return null;
  }
}
