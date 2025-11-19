module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Allow TS/TSX path alias (@/*) at runtime to match tsconfig.json
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
          },
        },
      ],
      // Reanimated plugin must be listed last
      "react-native-reanimated/plugin",
    ],
  };
};
