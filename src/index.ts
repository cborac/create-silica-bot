#!/usr/bin/env node

import chalk from "chalk"
import { execSync } from "child_process"
import enquirer from "enquirer"
import fs from "fs/promises"
import path from "path";

const packageJson = require("../package.json")

async function exec(arg_0: Parameters<typeof execSync>[0], arg_1: Parameters<typeof execSync>[1]): Promise<Buffer | string> {
     return execSync(arg_0, arg_1);
}

const ASCI_ART = 
[...`l::::::::::::::::::::::::::::::::::::::l
::::::::::::::::::::::::::::::::::::::::
::::::::::::::::::::::::::::::::::::::::
::::::::::::::::::::::::::::::::::::::::
:::::::::::::::::ok00ko:::::::::::::::::
:::::::::::::::cdXWMMWXdc:::::::::::::::
::::::::::::::cxXMMMMMMXxc::::::::::::::
:::::::::::::ckNMMMMMMMMNkl:::::::::::::
::::::::::::lOWMMMMMMMMMMWOl::::::::::::
:::::::::::o0WMMMMMMMMMMMMW0o:::::::::::
:::::::::cdKWMMMMMMMMMMMMMMWKdc:::::::::
::::::::cxXMMMMMMMMMMMMMMMMMMXxc::::::::
::::::::cxXWWWWWWWWWWWWWWWWWWXxc::::::::
:::::::::clooooooooodoooooooolc:::::::::
::::::::::::::::::::::::::::::::::::::::
::::::::::::::::::::::::::::::::::::::::
::::::::::::::::::::::::::::::::::::::::
oc::::::::::::::::::::::::::::::::::::co`].map(x => x === ":" ? chalk.blueBright(x) : x === "\n" ? "\n" : " ").join("")

console.log(ASCI_ART)
console.log("\n")

const seperator = chalk.blueBright(" |  ")

const prefix = {
     ERROR: chalk.redBright("ERROR  ") + seperator,
     INFO: chalk.blueBright("INFO   ") + seperator,
     SUCCESS: chalk.green("SUCCESS") + seperator
}

console.log(prefix.INFO + `You are using ${packageJson.name} (v${packageJson.version})`)

try {
     exec("git --version", {
          stdio: "ignore"
     });
} catch (_) {
     console.log(prefix.ERROR + "You need git to run this command.")
}

let isYarnInstalled = false

try {
     exec("yarn --version", {
          stdio: "ignore"
     });

     isYarnInstalled = true
} catch (_) { }

(async () => {
     console.log("\n")
     const command = await enquirer.prompt([{
          type: "input",
          name: "name",
          message: "What is your bot called?",
          initial: "silica-framework-bot",
          validate(value) {
               return !value.includes(" ") && /^[^\s^\x00-\x1f\\?*:"";<>|\/.][^\x00-\x1f\\?*:"";<>|\/]*[^\s^\x00-\x1f\\?*:"";<>|\/.]+$/g.exec(value).length === 1
          },
     }, {
          type: "select",
          choices: [{
               name: "npm"
          },
          {
               name: isYarnInstalled ? "yarn" : "yarn - use 'npm install --location=global yarn' to install",
               disabled: !isYarnInstalled
          }],
          message: "Select which package manager to use",
          name: "manager"
     }]).catch(() => process.exit(0)) as Record<string, string>;

     const folderExists = await fs.stat(path.join(process.cwd(), command.name)).then(() => true).catch(err => err.code !== "ENOENT")

     if (folderExists) return console.log(prefix.ERROR + "Folder already exists, aborting");

     console.log(prefix.INFO + "Cloning the git repository")

     await exec(`git clone https://github.com/cborac/Silica-Framework.git ${command.name}`, {
          stdio: "ignore"
     });

     console.log(prefix.SUCCESS + "Cloned the repository")

     await fs.rm(path.join(process.cwd(), command.name, "LICENSE"));
     await fs.rm(path.join(process.cwd(), command.name, ".git"), {
          force: true,
          recursive: true
     });

     if (command.manager !== "yarn") await fs.rm(path.join(process.cwd(), command.name, "yarn.lock"));

     const botPackage = JSON.parse((await fs.readFile(path.join(process.cwd(), command.name, "package.json"))).toString());

     await fs.writeFile(path.join(process.cwd(), command.name, "package.json"), JSON.stringify({
          name: command.name,
          version: command.version,
          description: "A bot written with Silica Framework",
          author: "A precious person",
          license: "UNLICENSED",
          main: botPackage.main,
          devDependencies: botPackage.devDependencies,
          dependencies: botPackage.dependencies,
          engines: botPackage.engines,
          scripts: botPackage.scripts
     }, null, "  "));


     console.log(prefix.INFO + "Installing dependencies")

     await exec(`${command.manager} install`, {
          stdio: "ignore",
          cwd: path.join(process.cwd(), command.name)
     });

     console.log(prefix.SUCCESS + "Installed dependencies")
     console.log("\n")
     console.log(`${chalk.blueBright(command.name)} has been installed under ${chalk.blueBright("./" + command.name)}, follow the following steps to finalise your installation!`)
     console.log("\n")
     console.log(`1. Copy '${chalk.blueBright(".env.example")}' to '${chalk.blueBright(".env")}' and fill in the variables`)
     console.log("\n")
     console.log("2. Run the command below to sync your prisma schema and to generate prisma client")
     console.log(chalk.blueBright(`    $ ${command.manager} sync`))
     console.log("\n")
})();