const { getDefaultConfig } = require("expo/metro-config");
const fs = require("fs");
const path = require("path");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  };

  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
  };

  config.resolver.assetExts.push("png", "jpg", "jpeg", "gif", "webp");

  const assetsDir = path.join(__dirname, "src/assets");
  if (fs.existsSync(assetsDir)) {
    config.watchFolders = [...(config.watchFolders || []), assetsDir];
  }

  config.resolver.sourceExts.push("cjs");
  config.resolver.unstable_enablePackageExports = false;

  return config;
})();
