const {
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require("discord.js");

module.exports = {
  name: "servers",

  async execute(client, message, args) {
        await message.channel.sendTyping();
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply("Permission refusée.");
    }

    const results = [];

    for (const guild of client.guilds.cache.values()) {
      try {
        const channels = guild.channels.cache.filter(
          c =>
            c.isTextBased() &&
            c.permissionsFor(guild.members.me)?.has(
              PermissionFlagsBits.CreateInstantInvite
            )
        );

        const channel = channels.first();

        if (!channel) {
          results.push({
            name: guild.name,
            invite: "Aucune invitation disponible"
          });
          continue;
        }

        const invite = await channel.createInvite({
          maxAge: 0,
          maxUses: 0,
          unique: false,
          reason: "Commande servers"
        });

        results.push({
          name: guild.name,
          invite: invite.url
        });
      } catch (err) {
        results.push({
          name: guild.name,
          invite: "Impossible de générer une invitation"
        });
      }
    }

    const perPage = 10;
    const pages = [];

    for (let i = 0; i < results.length; i += perPage) {
      pages.push(results.slice(i, i + perPage));
    }

    let page = 0;

    const generateEmbed = (index) => {
    const current = pages[index];

    return new EmbedBuilder()
      .setColor(0xffff00)
      .setAuthor({
        name: `Serveurs de ${client.user.username}`,
        iconURL: client.user.displayAvatarURL({ dynamic: true })
      })
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .setDescription(
        current
          .map(g => `> **${g.name}**\n> 🔗 ${g.invite}`)
          .join("\n\n")
      )
      .setFooter({
        text: `Page ${index + 1}/${pages.length}`
      })
      .setTimestamp();
  };

    const generateButtons = (index) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("servers_prev")
          .setLabel("◀ Précédent")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(index === 0),

        new ButtonBuilder()
          .setCustomId("servers_next")
          .setLabel("Suivant ▶")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(index === pages.length - 1)
      );
    };

    const msg = await message.channel.send({
      embeds: [generateEmbed(page)],
      components: [generateButtons(page)]
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000
    });

    collector.on("collect", async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: "Tu ne peux pas utiliser ces boutons.",
          ephemeral: true
        });
      }

      if (interaction.customId === "servers_prev") {
        page = Math.max(page - 1, 0);
      }

      if (interaction.customId === "servers_next") {
        page = Math.min(page + 1, pages.length - 1);
      }

      await interaction.update({
        embeds: [generateEmbed(page)],
        components: [generateButtons(page)]
      });
    });

    collector.on("end", async () => {
      try {
        await msg.edit({ components: [] });
      } catch {}
    });
  }
};