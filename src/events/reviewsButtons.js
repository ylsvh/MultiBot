const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/reviews.json');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('review_delete_')) return;
    
    const userId = interaction.customId.split('_')[2];
    
    if (
      interaction.user.id !== userId &&
      !interaction.member.permissions.has('ManageMessages')
    ) {
      return interaction.reply({
        content: "Tu ne peux pas supprimer cet avis.",
        ephemeral: true
      });
    }
    let data = {};
    if (fs.existsSync(DATA_PATH)) {
      data = JSON.parse(fs.readFileSync(DATA_PATH));
    }
    delete data[userId];
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    await interaction.message.delete();
  }
};
