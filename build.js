import { readFileSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { rollup } from "rollup";
import dts from "rollup-plugin-dts";
import { defineRollupSwcOption, swc } from "rollup-plugin-swc3";

const isProduction = process.env.NODE_ENV === "production";

const paths = {
  root: process.cwd(),
  src: resolve(process.cwd(), "src"),
  dist: resolve(process.cwd(), "dist"),
  package: resolve(process.cwd(), "package.json"),
};

function getExternals() {
  const pkg = JSON.parse(readFileSync(paths.package, "utf-8"));
  return [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    /^node:/,
  ];
}

const swcConfig = defineRollupSwcOption({
  jsc: {
    target: "esnext",
    parser: {
      syntax: "typescript",
      decorators: true,
    },
    transform: {
      decoratorMetadata: true,
    },
  },
  sourceMaps: !isProduction,
});

const mainConfig = {
  input: resolve(paths.src, "index.ts"),
  external: getExternals(),
  output: [
    {
      file: resolve(paths.dist, "index.mjs"),
      format: "esm",
      sourcemap: !isProduction,
    },
    {
      file: resolve(paths.dist, "index.cjs"),
      format: "cjs",
      sourcemap: !isProduction,
    },
  ],
  plugins: [swc(swcConfig)],
};

const dtsConfig = {
  input: resolve(paths.src, "index.ts"),
  output: {
    file: resolve(paths.dist, "index.d.ts"),
    format: "es",
  },
  plugins: [dts()],
};

async function build() {
  try {
    console.log(
      `Building for ${isProduction ? "production" : "development"}...`,
    );

    // Clean and create dist directory
    await rm(paths.dist, { recursive: true, force: true }).catch(() => null);
    await mkdir(paths.dist, { recursive: true });

    // Build main bundles
    const mainBundle = await rollup(mainConfig);
    await Promise.all(
      mainConfig.output.map((output) => mainBundle.write(output)),
    );
    await mainBundle.close();

    // Build types
    const dtsBundle = await rollup(dtsConfig);
    await dtsBundle.write(dtsConfig.output);
    await dtsBundle.close();

    console.log("Build completed successfully");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
