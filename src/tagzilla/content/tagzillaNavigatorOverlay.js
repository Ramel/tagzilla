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
 * The Original Code in this file was released on June 29, 2003
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
// Executed at Startup
////////////////////////////////////////////////////////////////////////////////

if(readMyPref("tagzilla.textbox.trapkey","bool",true)) {
    window.addEventListener("load", tagzillaNavLoad, true);
}

////////////////////////////////////////////////////////////////////////////////
// tagzillaNavLoad
//  Called each time a document is loaded
//
// Parameters: none
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tagzillaNavLoad() {
    var myDoc = getBrowser().contentDocument;
    var textAreas = myDoc.getElementsByTagName("textarea");
    if(textAreas.length == 0) return;

    for (var i=0; i<textAreas.length; i++) {
        textAreas.item(i).addEventListener("keypress", tzTextarea, false);
    }
}

////////////////////////////////////////////////////////////////////////////////
// tzTextarea
//  Called by the onkeypress handler installed above
//
// Parameters: e: the keypress event
// Returns: nothing
////////////////////////////////////////////////////////////////////////////////
function tzTextarea(e) {
    if(!(e.ctrlKey && (e.charCode == 74 || e.charCode==106))) return;
    e.preventDefault();
    if(readMyPref("tagzilla.textbox.pick","bool",false)) {
      var tag = tzRandTaglineFromFile(readMyPref("tagzilla.default.file","string",""));
      if(tag) {
        var prefix = readMyPref("tagzilla.clipboard.prefix","string","")
          .replace(/\\n/g,"\n");
        var suffix = readMyPref("tagzilla.clipboard.suffix","string","")
          .replace(/\\n/g,"\n");

        e.currentTarget.value += prefix+tag+suffix;
      }
    }
    else {
      window.openDialog("chrome://tagzilla/content/tagzilla.xul",
          "_blank", "chrome,all,dialog", "TZ_TEXTBOX", e.currentTarget);
    }
}
