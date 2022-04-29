import chalk from "chalk";
import { Unzip } from "zip-lib";
import chokidar from "chokidar";
import { join } from "path";
import { access, rm, cp } from "fs/promises";

const targetPath = "__temp_dir__"; // name of the temporary directory created while extracing and placing the Site Editor at the apt place

export function cli(args) {
  const zipPath = args[0] || "edit-site-export";
  watchExportedDataZip(zipPath);
}

/**
 * Watch the given path and update ./templates and ./parts on change
 * @param {String} zipPath The path of the zip file to watch
 */
function watchExportedDataZip(zipPath) {
  chokidar.watch("*.zip").on("add", async (path) => {
    if (path.includes(zipPath)) await updatePartsAndTemplates(path);
  });

  console.log(chalk.blue(`Watching CWD for ${chalk.magenta(zipPath)}...`));
}

/**
 * Update the theme's ./parts and ./templates using the exported data in the given .zip file
 * @param {String} zipPath Path of the zip file using which parts and templates are to be updated
 */
async function updatePartsAndTemplates(zipPath) {
  try {
    await unzipData(zipPath);
    await moveData(zipPath);
    console.log(
      "%s Updated %s and %s successfully.",
      chalk.bgGreen("SUCCESS!"),
      chalk.magenta("templates"),
      chalk.magenta("parts")
    );
  } catch (e) {
    console.error("%s There was an error.", chalk.bgRed("ERROR!"));
  }
}

/**
 * Extract Site Editor exported data from the zip file at the given path
 * @param {String} zipPath Path of the zip file from which the Site Editor data is to be extracted
 */
async function unzipData(zipPath) {
  try {
    await new Unzip().extract(zipPath, targetPath);
  } catch (e) {
    console.error("%s Couldn't extract the zip data.", chalk.bgRed("ERROR!"));
    console.trace(e);
    throw new Error("Exreaction failed");
  }
}

/**
 * Copy the extracted Site Editor data to ./templates and ./parts
 * @param {String} zipPath Path of the zip file from which the data was extracted
 */
async function moveData(zipPath) {
  try {
    if (pathExists("templates")) await deletePath("templates");
    if (pathExists("parts")) await deletePath("parts");

    await cp(join(targetPath, "theme"), "./", {
      recursive: true,
      force: true,
    });

    await deletePath(targetPath);
    await deletePath(zipPath);
  } catch (e) {
    console.error(
      "%s There was an error moving the data.",
      chalk.bgRed("ERROR!")
    );
    console.trace(e);
    throw new Error("Moving the data failed");
  }
}

/**
 * Check whether a file or dir at the given path exists
 * @param {String} path Path of the dir or file whose existence is to be checked
 * @returns boolean
 */
async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Delete a file or a directory
 * @param {String} path Path of the file or dir to be deleted
 */
async function deletePath(path) {
  try {
    await rm(path, { recursive: true, force: true });
  } catch {
    console.error(
      "%s There was an error in deleting %s.",
      chalk.bgRed("ERROR!"),
      path
    );
  }
}
