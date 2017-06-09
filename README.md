# SVG 2 UWP Tiles

This utility takes as input an SVG file (preferably on a transparent background) which will be resized/padded etc. into the various [UWP Tile & Icon assets](https://docs.microsoft.com/en-us/windows/uwp/controls-and-patterns/tiles-and-notifications-app-assets).

![UWP Generated Logos & Tiles](https://mgagne.blob.core.windows.net/public/uwp_logos_tiles.PNG)

But wait, can't you just use the [Auto-generate visual assets for your UWP apps](https://blogs.windows.com/buildingapps/2017/03/07/visual-studio-2017-now-ready-windows-application-development-needs/#ELgkBgKoWGSGx8cs.97) feature found in Visual Studio 2017? YES you can and it's great! I created this for those who don't have/want to install Visual Studio to generate these as well as to provide a little more flexibility/customization, and to learn about how the Logos/Tiles are used.

## Installation

### Save as developer depedency to an existing project

    npm install svg2uwptiles --save-dev

### Install globally

    npm install svg2uwptiles -g

## Usage

    Usage: svg2uwptiles [options]

    Options:

      -h, --help                           output usage information
      -V, --version                        output the version number
      -i, --icon-file <path>               Source SVG icon file
      -c, --canvas-file <path>             Optional canvas (background) file, default: blank.svg
      -o, --output-folder <path>           Destination folder for generated assets, default: ./assets
      -n, --names-in-tiles <true|false>    Boolean indicating if names will be included in the tiles which will case padding to be added, default: false
      -u, --include-unplated <true|false>  Boolean indicating if unplated tiles (for taskbar icons) should be includes, default: true


## Examples

### Generate all icons/tiles including unplated tiles for the given SVG file into ./assets

    svg2uwptiles -i myIcon.svg


### Generate all icons/tiles including unplated tiles for the given SVG file into a custom output folder

    svg2uwptiles -i myIcon.svg -o "c:\assets"

## Note to Electron users

If using [electron-windows-store](https://github.com/felixrieseberg/electron-windows-store) ensure that your assets folder is **not** under the `input-directory` specified, otherwise you will get errors from `MakePri`.

If using unplated icons (which IMO look better in the taskbar and is the default) you will need to include the argument `--make-pri true` in your `electron-windows-store` call.

Here's an example of my `electron-windows-store` call (as a .cmd)


      electron-windows-store ^
      --identity-name <NAME> ^
      --package-display-name <NAME> ^
      --assets "C:\<SOME_DIR>assets" ^
      --manifest "C:\<SOME_DIR>\AppXManifest.xml" ^
      --input-directory "C:\<SOME_DIR>\<APP_NAME>-win32-x64" ^
      --output-directory "C:\<SOME_DIR>\<APP_NAME>-uwp\app" ^
      --flatten true ^
      --package-version 1.0.0.0 ^
      --package-name <EXE_NAME> ^
      --make-pri true ^
      --verbose true

## AppxManifest

To ensure the generated icons are used in your UWP application ensure your Logo/Tile names match the ones generated. The following is an example of the `VisualElements` node:

      <uap:VisualElements DisplayName="DemoApp" Square150x150Logo="Assets\Square150x150Logo.png" Square44x44Logo="Assets\Square44x44Logo.png" Description="DemoApp" BackgroundColor="transparent">
        <uap:LockScreen Notification="badgeAndTileText" BadgeLogo="Assets\BadgeLogo.png" />
        <uap:DefaultTile Wide310x150Logo="Assets\Wide310x150Logo.png" Square310x310Logo="Assets\LargeTile.png" Square71x71Logo="Assets\SmallTile.png"></uap:DefaultTile>
        <uap:SplashScreen Image="Assets\SplashScreen.png" />
      </uap:VisualElements>