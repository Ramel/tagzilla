const APP_DISPLAY_NAME = "TagZilla";
const APP_NAME = "tagzilla";
const APP_PACKAGE = "/tagzilla.mozdev.org/tagzilla";
const APP_VERSION = "0.066.1";

const APP_JAR_FILE = "tagzilla.jar";
const APP_CONTENT_FOLDER = "tagzilla/content/";

const APP_LOCALE_FOLDER  = "tagzilla/locale/"
const APP_LOCALES = [ "en-US", "de-DE", "de-AT", "fr-FR", "ru-RU" ];
// See below for how these are put together

const APP_SKIN_FOLDER = "tagzilla/skin/"
const APP_SKINS = [ "classic" ];

const APP_SUCCESS_MESSAGE = "You may need to restart this program first.";


const INST_TO_PROFILE = "Do you wish to install "+APP_DISPLAY_NAME+" to your profile?\nThis will mean it does not need reinstalling when you update your Mozilla program.\n(Click Cancel if you want "+APP_DISPLAY_NAME+" installing to the system directory.)";

initInstall(APP_NAME, APP_PACKAGE, APP_VERSION);

// profile installs only work since 2003-03-06
var instToProfile = confirm(INST_TO_PROFILE);

var chromef = instToProfile ? getFolder("Profile", "chrome") : getFolder("chrome");
var cflag   = instToProfile ? PROFILE_CHROME                 : DELAYED_CHROME;

var err = addFile(APP_PACKAGE, APP_VERSION, "chrome/"+APP_JAR_FILE, chromef, null)

if(err == SUCCESS) {
    var prefFolder = getFolder('Program', 'defaults/pref/');
    addFile("tagzilla", "defaults/preferences/tagzilla_prefs.js", prefFolder, '');

    var compFolder = getFolder('Components');
    addFile("tagzilla", "components/tzprefs-service.js", compFolder, '');

    var jar = getFolder(chromef, APP_JAR_FILE);
    registerChrome( CONTENT    | cflag, jar, APP_CONTENT_FOLDER);

    for(var i in APP_LOCALES)
        registerChrome( LOCALE | cflag, jar, APP_LOCALE_FOLDER+APP_LOCALES[i]+"/" );
        // I would rather have used APP_LOCALE_FOLDER.replace( /%s/, APP_LOCALES[i] )
        // but that didn't work.  From install.log: "APP_LOCALE_FOLDER.replace is not a function"

    for(var i in APP_SKINS)
        registerChrome( SKIN   | cflag, jar, APP_SKIN_FOLDER+APP_SKINS[i]+"/" );


    err = performInstall();
    if(err == SUCCESS || err == 999) {
        alert(APP_DISPLAY_NAME+" "+APP_VERSION+" has been succesfully installed.\n"+APP_SUCCESS_MESSAGE);
    } else {
        alert("Install failed. Error code:" + err);
        cancelInstall(err);
    }
} else {
    alert("Failed to create " +APP_JAR_FILE +"\n"
        +"You probably don't have appropriate permissions \n"
        +"(write access to your profile or chrome directory). \n"
        +"_____________________________\nError code:" + err);
    cancelInstall(err);
}
