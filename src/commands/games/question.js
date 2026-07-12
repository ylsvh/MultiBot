const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelSelectMenuBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../../../data/questions.json");

function loadData() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "{}");
    }

    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveData(data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 4)
    );
}


module.exports = {
    name: "question",
    description: "Configure une question du jour",

    async execute(client, message, args) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply(
                "❌ Vous devez être administrateur pour utiliser cette commande."
            );
        }


        const data = loadData();


        if (!data[message.guild.id]) {

            data[message.guild.id] = {
                channel: null,
                title: null,
                description: null,
                answers: [],
                correct: null,
                answered: []
            };

            saveData(data);
        }


        const question = data[message.guild.id];


        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
`# ❓ Configuration Question du jour

**Salon :**
${question.channel ? `<#${question.channel}>` : "Non configuré"}

**Question :**
${question.title ?? "Non configurée"}

**Description :**
${question.description ?? "Aucune"}

**Réponses :**
${question.answers.length ? question.answers.join(", ") : "Aucune"}

**Bonne réponse :**
${question.correct ?? "Non définie"}`
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            );


        const buttons = new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId("question_channel")
                    .setLabel("Choisir salon")
                    .setStyle(ButtonStyle.Primary),


                new ButtonBuilder()
                    .setCustomId("question_title")
                    .setLabel("Définir question")
                    .setStyle(ButtonStyle.Secondary),


                new ButtonBuilder()
                    .setCustomId("question_description")
                    .setLabel("Description")
                    .setStyle(ButtonStyle.Secondary)

            );


        const buttons2 = new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId("question_answer_add")
                    .setLabel("Ajouter réponse")
                    .setStyle(ButtonStyle.Success),


                new ButtonBuilder()
                    .setCustomId("question_correct")
                    .setLabel("Définir bonne réponse")
                    .setStyle(ButtonStyle.Success),


                new ButtonBuilder()
                    .setCustomId("question_publish")
                    .setLabel("Publier")
                    .setStyle(ButtonStyle.Danger)

            );


        await message.channel.send({

            flags: MessageFlags.IsComponentsV2,

            components:[
                container,
                buttons,
                buttons2
            ]

        });

    }
};
