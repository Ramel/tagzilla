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
// Globals
////////////////////////////////////////////////////////////////////////////////

// Nothing here for the moment

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
  var mvPreference = Components.classes[ "@mozilla.org/preferences;1" ]
                               .getService( Components.interfaces.nsIPrefBranch );

  switch( prefType )
    {
      case "bool": 
        {
          try {
            prefValue = mvPreference.getBoolPref( prefIdentifier ); 
          }
          catch( ex ) {
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
          }
          catch( ex ) {
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
                                     Components.interfaces.nsISupportsWString );
          }
          catch( ex ) {
            writePref( prefType, prefIdentifier, defaultSetup );
            return ( defaultSetup );
          }
          return prefValue.data.length ? prefValue.data : defaultSetup;
        }
      case "char":
        {
          try {
            prefValue = mvPreference.getCharPref( prefIdentifier );
          }
          catch( ex ) {
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
          }
          catch( ex ) {
            writePref( prefType, prefIdentifier, defaultSetup );
            return ( defaultSetup );
          }
          return prefValue.data.length ? prefValue.data : defaultSetup;
        }
      default:
        {
          dump( 'readMyPref: Unsupported pref type "'+prefType+'" used\n' );
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
  var mvPreference = Components.classes[ "@mozilla.org/preferences;1" ]
                     .getService( Components.interfaces.nsIPrefBranch );

  try {
    switch ( prefType ) {
      case "bool":
        {
          mvPreference.setBoolPref( prefString, prefValue );
          break;
        }
      case "int":
        {
          mvPreference.setIntPref( prefString, prefValue );
          break;
        }
      case "string":
        {
          var str = Components.classes[ "@mozilla.org/supports-wstring;1" ] 
                                       .createInstance(Components.interfaces.nsISupportsWString);
          str.data = prefValue;
          mvPreference.setComplexValue( prefString, Components.interfaces.nsISupportsWString, str );
          break;
        }
      case "url":
        {
          mvPreference.setComplexValue( prefIdentifier, Components.interfaces.nsIPrefLocalizedString, 
                                        prefValue );
          break;
        }
      case "char":
        {
          mvPreference.setCharPref( prefString, prefValue );
          break;
        }
      default:
        {
          alert( 'Error: Unsupported pref type used!' );
        }
    }
  }
  catch ( ex ) { // die silently 
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
  if(tzBundle) {
    try {
      return tzBundle.GetStringFromName( aStr );
    }
    catch(e) {}
  }
  return null;
}

