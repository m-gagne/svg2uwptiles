#! /usr/bin/env node

// Marc Gagne
//
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
//        http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.

'use strict';

const program = require('commander')
const fs = require('pn/fs');
const sharp = require("sharp")
const pack = require('./package.json')

program
  .alias('svg2uwptiles')
  .version(pack.version)
  .option('-i, --icon-file <path>', 'Source SVG icon file')
  .option('-c, --canvas-file <path>', 'Optional canvas (background) file, default: blank.svg', 'blank.svg')
  .option('-o, --output-folder <path>', 'Destination folder for generated assets, default: ./assets', './assets')
  .option('-n, --names-in-tiles <true|false>', 'Boolean indicating if names will be included in the tiles which will case padding to be added, default: false', false)
  .option('-u, --include-unplated <true|false>', 'Boolean indicating if unplated tiles (for taskbar icons) should be includes, default: true', true)
  .parse(process.argv)

const options = program.opts();

if (!options.iconFile) {
  return program.outputHelp();
}

let buffers = {
  canvas: null,
  overlay: null
};


// UWP Tile/Icon Documentation: https://docs.microsoft.com/en-us/windows/uwp/controls-and-patterns/tiles-and-notifications-app-assets

const assets = {
  scales: [1, 1.25, 1.5, 2, 4],
  categories: [
    { // Small
      width: 71,
      height: 71,
      elementName: "SmallTile",
      paddingRatioWidth: 0.75,
      paddingRatioHeight: 0.75
    },
    { // Medium
      width: 150,
      height: 150,
      elementName: "MedTile",
      paddingRatioWidth: !options.namesInTiles ? 0.75 : 0.5,
      paddingRatioHeight: !options.namesInTiles ? 0.75 : 0.5
    },
    { // Wide310x150
      width: 310,
      height: 150,
      elementName: "Wide310x150Logo",
      paddingRatioWidth: !options.namesInTiles ? 0.75 : 0.5,
      paddingRatioHeight: !options.namesInTiles ? 0.75 : 0.5
    },
    { // Large
      width: 310,
      height: 310,
      elementName: "LargeTile",
      paddingRatioWidth: !options.namesInTiles ? 0.75 : 0.5,
      paddingRatioHeight: !options.namesInTiles ? 0.75 : 0.5
    },
    { // Splash
      width: 620,
      height: 300,
      elementName: "SplashScreen",
      //generateNonScaled: true
    },
    { // Square44x44
      width: 44,
      height: 44,
      elementName: "Square44x44Logo",
      targets: [16, 24, 32, 48, 256, 20, 30, 26, 40, 60, 64, 72, 80, 96],
      unplated: true,
      paddingRatioWidth: !options.namesInTiles ? 0.75 : 0.5,
      paddingRatioHeight: !options.namesInTiles ? 0.75 : 0.5
    },
    { // Square150x150
      width: 150,
      height: 150,
      elementName: "Square150x150Logo",
      paddingRatioWidth: !options.namesInTiles ? 0.75 : 0.5,
      paddingRatioHeight: !options.namesInTiles ? 0.75 : 0.5
    },
    { // StoreLogo
      width: 50,
      height: 50,
      elementName: "StoreLogo",
      generateNonScaled: true,
      paddingRatioWidth: 0.75,
      paddingRatioHeight: 0.75
    }
  ]
};

// Verify output folder
if (!fs.existsSync(options.outputFolder)){
    fs.mkdirSync(options.outputFolder);
}

fs.readFile(options.canvasFile)
  .then((buffer) => {
    buffers.canvas = buffer;
    return fs.readFile(options.iconFile)
  })
  .then((buffer) => {
    buffers.overlay = buffer;
    generateScales()
  })
  .then(() => {
    console.log("Done");
  });


function scaleToSize(outFilename, width, height, paddingRatioWidth, paddingRatioHeight) {
  width = Math.round(width);
  height = Math.round(height);

  paddingRatioWidth = paddingRatioWidth ? paddingRatioWidth : 1;
  paddingRatioHeight = paddingRatioHeight ? paddingRatioHeight : 1;

  return new Promise((resolve, reject) => {
    let overlayWidth = Math.round(width * paddingRatioWidth);
    let overlayHeight = Math.round(height * paddingRatioHeight);
    let left = Math.round(((width - overlayWidth) /  2));
    let top = Math.round(((height - overlayHeight) /  2));

    console.log("File: '" + outFilename + "', canvas WxH: " + width + "x" + height + ", overlay WxH: " + overlayWidth + "x" + overlayHeight + ", leftxtop: " + left + "x" + top);

    sharp(buffers.overlay)
      .resize({width: overlayWidth, height: overlayHeight, fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 0}})
      .toBuffer()
      .then((resizedOverlayBuffer) => {
        sharp(buffers.canvas)
          .resize({width, height, fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 0}})
          .composite([{input: resizedOverlayBuffer, left: left, top: top}])
          .toFile(outFilename, function(err) {
            if (err) {
              reject(err);
            }
            resolve();
        });
      })
  })
}

function generateScales() {
  let promises = [];

  console.log("Generating Icons...");

  assets.categories.forEach((category) => {
    if (category.generateNonScaled) {
      promises.push(scaleToSize(options.outputFolder + "/" + category.elementName + ".png", category.width, category.height, category.paddingRatioWidth, category.paddingRatioHeight));
    }
    assets.scales.forEach((multiplier) => {
      promises.push(scaleToSize(options.outputFolder + "/" + category.elementName + ".scale-" + (multiplier * 100) + ".png", category.width * multiplier, category.height * multiplier, category.paddingRatioWidth, category.paddingRatioHeight));
    });
    if (category.targets) {
      category.targets.forEach((target) => {
        promises.push(scaleToSize(options.outputFolder + "/" + category.elementName + ".targetsize-" + target + ".png", target, target, 1, 1));

        if (category.unplated && options.includeUnplated) {
          promises.push(scaleToSize(options.outputFolder + "/" + category.elementName + ".targetsize-" + target + "_altform-unplated.png", target, target, 1, 1));
        }
      });
    }
  });

  return new Promise((resolve, reject) => {
    Promise.all(promises).then(resolve());
  });
}