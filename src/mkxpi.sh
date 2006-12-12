#!/bin/bash

[ -f tagzilla.jar ] || ./mkjar.sh

WORKDIR=xpiwork
mkdir -p $WORKDIR/chrome $WORKDIR/components $WORKDIR/defaults/preferences
cp install.js install.rdf translator.credits.txt $WORKDIR
mv tagzilla.jar $WORKDIR/chrome
cp tagzilla_prefs.js $WORKDIR/defaults/preferences
cp components/tzprefs-service.js $WORKDIR/components

cd $WORKDIR
zip -r ../tagzilla.xpi *
cd ..
rm -rf $WORKDIR
