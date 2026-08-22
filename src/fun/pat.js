const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pat')
        .setDescription('Patte un membre mentionné')
        .addUserOption(option =>
            option
                .setName('membre')
                .setDescription('Le membre à patter')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const member = interaction.options.getMember('membre');
        const user = interaction.options.getUser('membre');

        const embed = new EmbedBuilder()
            .setColor('#464ec2')
            .setTitle(`${interaction.user.username} pat ${user.username} !`)
            .setDescription(`${interaction.user} pat ${user} !`);

        await interaction.editReply({
            embeds: [embed]
        });
    }
};