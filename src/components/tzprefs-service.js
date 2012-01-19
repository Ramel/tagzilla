/*
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "MPL"); you may not use this file
 * except in compliance with the MPL. You may obtain a copy of
 * the MPL at http://www.mozilla.org/MPL/
 *
 * Software distributed under the MPL is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the MPL for the specific language governing
 * rights and limitations under the MPL.
 *
 * The Original Code is Tagzilla.
 *
 * The Initial Developer of this code is Patrick Brunschwig.
 * Portions created by Patrick Brunschwig <patrick.brunschwig@gmx.net> are
 * Copyright (C) 2003 Patrick Brunschwig. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the
 * terms of the GNU General Public License (the "GPL"), in which case
 * the provisions of the GPL are applicable instead of
 * those above. If you wish to allow use of your version of this
 * file only under the terms of the GPL and not to allow
 * others to use your version of this file under the MPL, indicate
 * your decision by deleting the provisions above and replace them
 * with the notice and other provisions required by the GPL.
 * If you do not delete the provisions above, a recipient
 * may use your version of this file under either the MPL or the
 * GPL.
 */


// components defined in this file
const TAGZILLA_PREFS_EXTENSION_SERVICE_CONTRACTID =
    "@mozilla.org/accountmanager/extension;1?name=tzprefs";
const TAGZILLA_PREFS_EXTENSION_SERVICE_CID =
    Components.ID("{4eac6fec-f68b-4797-be7a-ffeea73e1495}");

// interafces used in this file
const nsIMsgAccountManagerExtension  = Components.interfaces.nsIMsgAccountManagerExtension;
const nsICategoryManager = Components.interfaces.nsICategoryManager;
const nsISupports        = Components.interfaces.nsISupports;

function TagzillaPrefService() {}

TagzillaPrefService.prototype.name = "tzprefs";
TagzillaPrefService.prototype.chromePackageName = "tagzilla";
TagzillaPrefService.prototype.showPanel = function(server) {
    // Show TagZilla panel for all account types
    // return true;
    // don't show the panel for rss, or local accounts
    return (server.type != "rss" && server.type != "none");
};

// factory for command line handler service (TagzillaPrefService)
var TagzillaPrefFactory = new Object();

TagzillaPrefFactory.createInstance =
function (outer, iid) {
  if (outer != null)
    throw Components.results.NS_ERROR_NO_AGGREGATION;

  if (!iid.equals(nsIMsgAccountManagerExtension) && !iid.equals(nsISupports))
    throw Components.results.NS_ERROR_INVALID_ARG;

  return new TagzillaPrefService();
}


var TagzillaPrefsModule = new Object();

TagzillaPrefsModule.registerSelf =
function (compMgr, fileSpec, location, type)
{
  dump("Registering TagZilla account manager extension.\n");

  compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
  compMgr.registerFactoryLocation(TAGZILLA_PREFS_EXTENSION_SERVICE_CID,
                                  "TagZilla Account Manager Extension Service",
                                  TAGZILLA_PREFS_EXTENSION_SERVICE_CONTRACTID,
                                  fileSpec,
                                  location,
                                  type);
  catman = Components.classes["@mozilla.org/categorymanager;1"].getService(nsICategoryManager);
  catman.addCategoryEntry("mailnews-accountmanager-extensions",
                            "TagZilla account manager extension",
                            TAGZILLA_PREFS_EXTENSION_SERVICE_CONTRACTID, true, true);
  dump("TagZilla account manager extension registered.\n");
}

TagzillaPrefsModule.unregisterSelf =
function(compMgr, fileSpec, location)
{
  compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
  compMgr.unregisterFactoryLocation(TAGZILLA_PREFS_EXTENSION_SERVICE_CID, fileSpec);
  catman = Components.classes["@mozilla.org/categorymanager;1"].getService(nsICategoryManager);
  catman.deleteCategoryEntry("mailnews-accountmanager-extensions",
                             TAGZILLA_PREFS_EXTENSION_SERVICE_CONTRACTID, true);
}

TagzillaPrefsModule.getClassObject =
function (compMgr, cid, iid) {
  if (cid.equals(TAGZILLA_PREFS_EXTENSION_SERVICE_CID))
    return TagzillaPrefFactory;


  if (!iid.equals(Components.interfaces.nsIFactory))
    throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

  throw Components.results.NS_ERROR_NO_INTERFACE;    
}

TagzillaPrefsModule.canUnload =
function(compMgr)
{
  return true;
}

// entrypoint
function NSGetModule(compMgr, fileSpec) {
  return TagzillaPrefsModule;
}


