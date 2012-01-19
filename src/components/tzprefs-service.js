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


// interafces used in this file
const nsIMsgAccountManagerExtension  = Components.interfaces.nsIMsgAccountManagerExtension;
const nsICategoryManager = Components.interfaces.nsICategoryManager;
const nsISupports        = Components.interfaces.nsISupports;

function TagzillaPrefService() {}

TagzillaPrefService.prototype = {
  name: "tzprefs",
  chromePackageName: "tagzilla",
  showPanel: function(server)
  {
    // Show TagZilla panel for all account types except rss and
    // local accounts.
    return (server.type != "rss" && server.type != "none");
  }
}

// factory for TagzillaPrefService.
var TagzillaPrefFactory = {
  createInstance: function (outer, iid) {
    if (outer != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    if (!iid.equals(nsIMsgAccountManagerExtension) &&
        !iid.equals(nsISupports))
      throw Components.results.NS_ERROR_INVALID_ARG;
    return new TagzillaPrefService();
  },

  lockFactory: function lockFactory(aLock) { }
}

function TagzillaPrefsModule() {}

TagzillaPrefsModule.prototype = {

  // TAGZILLA_PREFS_EXTENSION_SERVICE_CID
  classID: Components.ID("{4eac6fec-f68b-4797-be7a-ffeea73e1495}"),
  // TAGZILLA_PREFS_EXTENSION_SERVICE_CONTRACTID
  contractID: "@mozilla.org/accountmanager/extension;1?name=tzprefs",
  mCategory: "TagZilla-account-manager-extension",
  classDescription: "TagZilla Account Manager Extension Service",

  _xpcom_categories: [{
    category: "mailnews-accountmanager-extensions",
    entry: this.mCategory
  }],

  registerSelf: function (compMgr, fileSpec, location, type)
  {
    //dump("Registering TagZilla account manager extension.\n");
    compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    compMgr.registerFactoryLocation(this.classID,
                                    this.mCategory,
                                    thi.contractID,
                                    fileSpec,
                                    location,
                                    type);
    Components.classes["@mozilla.org/categorymanager;1"]
              .getService(nsICategoryManager)
              .addCategoryEntry("mailnews-accountmanager-extensions",
                                this.mCategory,
                                this.contractID, true, true);
    //dump("TagZilla account manager extension registered.\n");
  },

  unregisterSelf: function(compMgr, fileSpec, location)
  {
    compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    compMgr.unregisterFactoryLocation(this.classID, fileSpec);
    Components.classes["@mozilla.org/categorymanager;1"]
              .getService(nsICategoryManager)
              .deleteCategoryEntry("mailnews-accountmanager-extensions",
                                   this.mCategory, true);
  },


  getClassObject: function (compMgr, cid, iid)
  {
    if (!iid.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
    if (!cid.equals(this.classID))
      throw Components.results.NS_ERROR_NO_INTERFACE;    
    return TagzillaPrefFactory;
  },

  canUnload: function(compMgr)
  {
    return true;
  },

  /* QueryInterface */
  QueryInterface: function(aIID)
  {
    if (aIID.equals(Components.interfaces.nsISupports) ||
        aIID.equals(nsIMsgAccountManagerExtension))
    {
      return new TagzillaPrefService();
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  /* nsIFactory for TagzillaPrefService */
  createInstance: function (outer, iid)
  {
    if (outer != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    return this.QueryInterface(aIID);
  }
}

/*
 * entrypoint
 * XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4, SeaMonkey 2.1).
 * XPCOMUtils.generateNSGetModule is for Mozilla 1.9.1 (Firefox 3.5).
 */

try
{
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
}
catch(e) { }

if ("undefined" == typeof XPCOMUtils) // Firefox <= 2.0
{
  function NSGetModule(aComMgr, aFileSpec)
  {
    return new TagzillaPrefsModule();
  }
}

var NSGetFactory, NSGetModule;
if (XPCOMUtils.generateNSGetFactory)
  NSGetFactory = XPCOMUtils.generateNSGetFactory([TagzillaPrefsModule]);
else
  NSGetModule = XPCOMUtils.generateNSGetModule([TagzillaPrefsModule]);
