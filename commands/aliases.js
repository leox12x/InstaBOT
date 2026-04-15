module.exports = {
 config: {
  name: "setalias",
  version: "1.8",
  author: "Rahman Leon",
  countDown: 5,
  role: 0,
  description: {
   vi: "Thêm tên gọi khác cho 1 lệnh bất kỳ trong nhóm của bạn",
   en: "Add an alias for any command in your group"
  },
  category: "config",
  guide: {
   vi: "  Lệnh dùng để thêm/xóa tên gọi khác cho 1 lệnh nào đó để tiện sử dụng trong nhóm chat của bạn"
    + "\n   {pn} add <tên gọi khác> <tên lệnh>: dùng để thêm tên gọi khác cho lệnh trong nhóm chat của bạn"
    + "\n   {pn} add <tên gọi khác> <tên lệnh> -g: dùng để thêm tên gọi khác cho lệnh trong toàn hệ thống (chỉ admin bot)"
    + "\nVí dụ:\n    {pn} add ctrk customrankcard"
    + "\n\n   {pn} [remove | rm] <tên gọi khác> <tên lệnh>: dùng để xóa tên gọi khác của lệnh trong nhóm chat của bạn"
    + "\n   {pn} [remove | rm] <tên gọi khác> <tên lệnh> -g: dùng để xóa tên gọi khác của lệnh trong toàn hệ thống (chỉ admin bot)"
    + "\nVí dụ:\n    {pn} rm ctrk customrankcard"
    + "\n\n   {pn} list: dùng để xem danh sách tên gọi khác của các lệnh trong nhóm bạn"
    + "\n   {pn} list -g: dùng để xem danh sách tên gọi khác của các lệnh trong nhóm bạn",
   en: "  This command is used to add/remove alias for any command in your group"
    + "\n   {pn} add <alias> <command>: add an alias for the command in your group"
    + "\n   {pn} add <alias> <command> -g: add an alias for the command in the whole system (only bot admin)"
    + "\nExample:\n    {pn} add ctrk customrankcard"
    + "\n\n   {pn} [remove | rm] <alias> <command>: remove an alias for the command in your group"
    + "\n   {pn} [remove | rm] <alias> <command> -g: remove an alias for the command in the whole system (only bot admin)"
    + "\nExample:\n    {pn} rm ctrk customrankcard"
    + "\n\n   {pn} list: list all alias for commands in your group"
    + "\n   {pn} list -g: list all alias for commands in the whole system"
  }
 },

 onStart: async function ({ message, event, args, threadsData, globalData, role, getLang }) {
  const aliasesData = await threadsData.get(event.threadID, "data.aliases", {});

  switch (args[0]) {
   case "add": {
    if (!args[2])
     return message.SyntaxError();
    const commandName = args[2].toLowerCase();
    if (!global.GoatBot.commands.has(commandName))
     return message.reply(getLang("commandNotExist", commandName));
    const alias = args[1].toLowerCase();

    if (args[3] == '-g') {
     if (role > 1) {
      const globalAliasesData = await globalData.get('setalias', 'data', []);
      const globalAliasesExist = globalAliasesData.find(item => item.aliases.includes(alias));
      if (globalAliasesExist)
       return message.reply(getLang("aliasExist", alias, globalAliasesExist.commandName));
      if (global.GoatBot.aliases.has(alias))
       return message.reply(getLang("aliasExist", alias, global.GoatBot.aliases.get(alias)));
      const globalAliasesThisCommand = globalAliasesData.find(aliasData => aliasData.commandName == commandName);
      if (globalAliasesThisCommand)
       globalAliasesThisCommand.aliases.push(alias);
      else
       globalAliasesData.push({
        commandName,
        aliases: [alias]
       });
      await globalData.set('setalias', globalAliasesData, 'data');
      global.GoatBot.aliases.set(alias, commandName);
      return message.reply(getLang("addAliasSuccess", alias, commandName));
     }
     else {
      return message.reply(getLang("noPermissionAdd", alias, commandName));
     }
    }

    if (global.GoatBot.commands.get(alias))
     return message.reply(getLang("aliasIsCommand", alias));
    if (global.GoatBot.aliases.has(alias))
     return message.reply(getLang("aliasExist", alias, global.GoatBot.aliases.get(alias)));
    for (const cmdName in aliasesData)
     if (aliasesData[cmdName].includes(alias))
      return message.reply(getLang("aliasExistInGroup", alias, cmdName));

    const oldAlias = aliasesData[commandName] || [];
    oldAlias.push(alias);
    aliasesData[commandName] = oldAlias;
    await threadsData.set(event.threadID, aliasesData, "data.aliases");
    return message.reply(getLang("addAliasToGroupSuccess", alias, commandName));
   }
   case "remove":
   case "rm": {
    if (!args[2])
     return message.SyntaxError();
    const commandName = args[2].toLowerCase();
    const alias = args[1].toLowerCase();

    if (!global.GoatBot.commands.has(commandName))
     return message.reply(getLang("commandNotExist", commandName));

    if (args[3] == '-g') {
     if (role > 1) {
      const globalAliasesData = await globalData.get('setalias', 'data', []);
      const globalAliasesThisCommand = globalAliasesData.find(aliasData => aliasData.commandName == commandName);
      if (!globalAliasesThisCommand || !globalAliasesThisCommand.aliases.includes(alias))
       return message.reply(getLang("aliasNotExist", alias, commandName));
      globalAliasesThisCommand.aliases.splice(globalAliasesThisCommand.aliases.indexOf(alias), 1);
      await globalData.set('setalias', globalAliasesData, 'data');
      global.GoatBot.aliases.delete(alias);
      return message.reply(getLang("removeAliasSuccess", alias, commandName));
     }
     else {
      return message.reply(getLang("noPermissionDelete", alias, commandName));
     }
    }

    const oldAlias = aliasesData[commandName];
    if (!oldAlias)
     return message.reply(getLang("noAliasInGroup", commandName));
    const index = oldAlias.indexOf(alias);
    if (index === -1)
     return message.reply(getLang("aliasNotExist", alias, commandName));
    oldAlias.splice(index, 1);
    await threadsData.set(event.threadID, aliasesData, "data.aliases");
    return message.reply(getLang("removeAliasInGroupSuccess", alias, commandName));
   }
   case "list": {
    if (args[1] == '-g') {
     const globalAliasesData = await globalData.get('setalias', 'data', []);
     const globalAliases = globalAliasesData.map(aliasData => ({
      commandName: aliasData.commandName,
      aliases: aliasData.aliases.join(', ')
     }));
     return message.reply(
      globalAliases.length ?
       getLang("aliasList", globalAliases.map(alias => `• ${alias.commandName}: ${alias.aliases}`).join('\n')) :
       getLang("noAliasInSystem")
     );
    }

    if (!Object.keys(aliasesData).length)
     return message.reply(getLang("notExistAliasInGroup"));
    const list = Object.keys(aliasesData).map(commandName => `• ${commandName}: ${aliasesData[commandName].join(", ")}`);
    return message.reply(getLang("aliasListInGroup", list.join("\n")));
   }
   default: {
    return message.SyntaxError();
   }
  }
 }
};