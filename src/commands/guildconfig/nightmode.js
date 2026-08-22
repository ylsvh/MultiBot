const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
  PermissionsBitField
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

function parseTime(time) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return null;

  return {
    hours: Number(match[1]),
    minutes: Number(match[2])
  };
}

function getNextTime(time) {
  const now = new Date();
  const date = new Date(now);

  date.setHours(time.hours, time.minutes, 0, 0);

  if (date <= now) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

async function restoreNightMode(guild) {
  const config = guildConfig.getAll(guild.id);
  const nightmode = config.nightmode;

  if (!nightmode?.enabled) return;

  for (const savedRole of nightmode.roles || []) {
    const role = guild.roles.cache.get(savedRole.id);

    if (!role) continue;

    try {
      await role.setPermissions(
        new PermissionsBitField(BigInt(savedRole.permissions)),
        'Night Mode terminé'
      );
    } catch (error) {
      console.error(`[NIGHTMODE] Impossible de restaurer le rôle ${savedRole.id}:`, error);
    }
  }

  guildConfig.set(guild.id, 'nightmode', {
    enabled: false,
    roles: [],
    startTime: null,
    endTime: null
  });
}

module.exports = {
  name: 'nightmode',
  description: 'Active ou désactive le mode nuit.',
  usage: '+nightmode <début> <fin>',

  async execute(message, args, client) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '## Mode nuit\nVous devez posséder la permission `Administrateur` pour utiliser cette commande.'
          )
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '## Mode nuit\nJe dois posséder la permission `Gérer les rôles`.'
          )
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const config = guildConfig.getAll(message.guild.id);

    if (config.nightmode?.enabled) {
      await restoreNightMode(message.guild);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '## Mode nuit désactivé\nLes permissions Administrateur sauvegardées ont été restaurées.'
          )
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    if (args.length < 2) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '## Mode nuit\nUtilisation : `+nightmode <début> <fin>`\n\nExemple : `+nightmode 02:00 10:30`'
          )
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const startTime = parseTime(args[0]);
    const endTime = parseTime(args[1]);

    if (!startTime || !endTime) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '## Mode nuit\nFormat invalide. Utilisez `HH:MM`.\n\nExemple : `02:00 10:30`'
          )
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    if (args[0] === args[1]) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '## Mode nuit\nLes deux horaires ne peuvent pas être identiques.'
          )
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const botMember = message.guild.members.me;
    const rolesToModify = [];

    for (const role of message.guild.roles.cache.values()) {
      if (role.id === message.guild.id) continue;
      if (role.managed) continue;
      if (role.position >= botMember.roles.highest.position) continue;
      if (!role.permissions.has(PermissionsBitField.Flags.Administrator)) continue;

      rolesToModify.push({
        id: role.id,
        permissions: role.permissions.bitfield.toString()
      });
    }

    if (!rolesToModify.length) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '## Mode nuit\nAucun rôle Administrateur pouvant être modifié n’a été trouvé.'
          )
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    let removed = 0;

    for (const savedRole of rolesToModify) {
      const role = message.guild.roles.cache.get(savedRole.id);

      try {
        const permissions = role.permissions.remove(
          PermissionsBitField.Flags.Administrator
        );

        await role.setPermissions(
          permissions,
          `Night Mode activé par ${message.author.tag}`
        );

        removed++;
      } catch (error) {
        console.error(`[NIGHTMODE] Impossible de modifier ${role.name}:`, error);
      }
    }

    if (!removed) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '## Mode nuit\nAucun rôle n’a pu être modifié. Vérifiez la hiérarchie des rôles.'
          )
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const start = getNextTime(startTime);
    const end = new Date(start);

    end.setHours(endTime.hours, endTime.minutes, 0, 0);

    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }

    guildConfig.set(message.guild.id, 'nightmode', {
      enabled: true,
      roles: rolesToModify,
      startTime: start.toISOString(),
      endTime: end.toISOString()
    });

    const duration = end.getTime() - start.getTime();

    setTimeout(async () => {
      try {
        await restoreNightMode(message.guild);
      } catch (error) {
        console.error(`[NIGHTMODE] Erreur de restauration:`, error);
      }
    }, duration);

    const endTimestamp = Math.floor(end.getTime() / 1000);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## Mode nuit activé\n\n` +
          `Les permissions \`Administrateur\` ont été retirées de **${removed} rôle(s)**.\n\n` +
          `**Début :** <t:${Math.floor(start.getTime() / 1000)}:F>\n` +
          `**Fin :** <t:${endTimestamp}:F>\n` +
          `**Restauration :** <t:${endTimestamp}:R>`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          'Les permissions originales seront automatiquement restaurées à la fin du mode nuit.'
        )
      );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};