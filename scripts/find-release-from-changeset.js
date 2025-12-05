/**
 * This script finds the version of a specific package from the published packages
 * output of the changesets action.
 * 
 * It reads the PUBLISHED_PACKAGES environment variable which contains a JSON array
 * of published packages, finds the package specified in PACKAGE_VERSION_TO_FOLLOW,
 * and outputs its version.
 */

const packageToFollow = process.env.PACKAGE_VERSION_TO_FOLLOW;
const publishedPackagesJson = process.env.PUBLISHED_PACKAGES;

if (!packageToFollow) {
  console.error('Error: PACKAGE_VERSION_TO_FOLLOW environment variable is not set');
  process.exit(1);
}

if (!publishedPackagesJson) {
  console.error('Error: PUBLISHED_PACKAGES environment variable is not set');
  process.exit(1);
}

try {
  const publishedPackages = JSON.parse(publishedPackagesJson);
  
  if (!Array.isArray(publishedPackages)) {
    console.error('Error: PUBLISHED_PACKAGES is not an array');
    process.exit(1);
  }

  const targetPackage = publishedPackages.find(
    pkg => pkg.name === packageToFollow
  );

  if (!targetPackage) {
    console.error(`Error: Package "${packageToFollow}" not found in published packages`);
    console.error('Published packages:', publishedPackages.map(p => p.name).join(', '));
    process.exit(1);
  }

  // Output just the version
  console.log(targetPackage.version);
  process.exit(0);
} catch (error) {
  console.error('Error parsing PUBLISHED_PACKAGES:', error.message);
  process.exit(1);
}
