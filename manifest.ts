import packageJson from "./package.json";

/**
 * After changing, please reload the extension at `chrome://extensions`
 */
const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: "screenshot-studio",
  version: packageJson.version,
  description: packageJson.description,
  permissions: ["sidePanel"],
  side_panel: {
    default_path: "src/pages/sidePanel/index.html",
  },
  background: {
    service_worker: "src/pages/background/index.js",
    type: "module",
  },
  action: {
    default_title: "Click to open panel",
    default_icon: "camera-128.png",
  },
  icons: {
    "128": "camera-128.png",
  },
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*", "file://*/*"],
      js: ["src/pages/content/index.js"],
      // KEY for cache invalidation
      css: ["assets/css/contentStyle<KEY>.chunk.css"],
    },
  ],
  web_accessible_resources: [
    {
      resources: ["assets/js/*.js", "assets/css/*.css", "camera-128.png"],
      matches: ["*://*/*"],
    },
  ],
};

export default manifest;
