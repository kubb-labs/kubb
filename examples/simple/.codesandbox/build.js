const fs = require("node:fs");

const pkgJsonPaths = [
  "package.json",
];
try {
  for (const pkgJsonPath of pkgJsonPaths) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const oldVersion = "workspace:*";
    const newVersion = "latest";


    const content = JSON.stringify(pkg, null, "\t") + "\n";
    console.log(content)
    const newContent = content
      // @ts-ignore
      .replaceAll(
        `"${oldVersion}"`,
        `"${newVersion}"`,
      )

    console.log(newContent)

    fs.writeFileSync(pkgJsonPath, newContent);
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}