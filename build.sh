#!/bin/sh

TARGET=$1
if [ "$TARGET" != "PROD" ]; then
  TARGET="DEV"
fi

VERSION=$2
# if VERSION is empty set it to latest
if [ -z "$VERSION" ]; then
    VERSION="latest"
fi

echo "Building $TARGET with version $VERSION"
yarn install
yarn run clean
yarn run build

mkdir -p dist/s3/$VERSION
cp -f dist/bec.js dist/s3/$VERSION/
if [ "$TARGET" = "DEV" ]; then
  cp -f demo/demo.html dist/s3/$VERSION/demo.html
  cp -f demo/demo-reactjs.html dist/s3/$VERSION/demo-reactjs.html
else
  cp -f demo/demo-prod.html dist/s3/$VERSION/demo.html
  cp -f demo/demo-reactjs-prod.html dist/s3/$VERSION/demo-reactjs.html
fi

ls -la dist/s3/$VERSION
ls -la dist/s3
