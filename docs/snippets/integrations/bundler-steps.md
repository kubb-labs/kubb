## Install Kubb and your output plugins

Follow the [installation guide](/docs/5.x/how-to/installation) to add Kubb and the plugins your output needs. The integration ships with `kubb` as `unplugin-kubb`.

## Configure the integration

Import your shared `kubb.config.ts` and pass it to the integration. The `config` must be a single object, not the array or function forms `defineConfig` accepts. Run the build command of your tool to generate the files.
