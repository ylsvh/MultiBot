const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config");

function getFiles(dir) {
  let files = [];

  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);

    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getFiles(fullPath));
    } else if (item.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

(async () => {
  const commands = [];

  const slashPath = path.join(__dirname, "src/slashCommands");
  const slashFiles = getFiles(slashPath);

  for (const file of slashFiles) {
    const cmd = require(file);

    if (cmd.data) {
      commands.push(cmd.data.toJSON());
    }
  }

  const rest = new REST({ version: "10" }).setToken(config.token);

  await rest.put(
    Routes.applicationCommands(config.clientId),
    { body: commands }
  );

  console.log(commands.length);
})();                                                                   
