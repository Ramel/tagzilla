#!/bin/bash

[ -f tagzilla.jar ] || ./mkjar.sh

WORKDIR=xpiwork
mkdir -p $WORKDIR/chrome $WORKDIR/defaults/preferences
cp install.js install.rdf $WORKDIR
mv tagzilla.jar $WORKDIR/chrome
cp tagzilla_prefs.js $WORKDIR/defaults/preferences

cd $WORKDIR
zip -r ../tagzilla.xpi *
cd ..
rm -rf $WORKDIR
