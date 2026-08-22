const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
  name: 'challenger',
  aliases: ['challenge'],

  async execute(client, message, args) {
    try {
      const user =
        message.mentions.users.first() ||
        message.guild.members.cache.get(args[0])?.user ||
        message.author;

      const silhouetted = args.includes('true');

      const avatarURL = user.displayAvatarURL({
        extension: 'png',
        size: 512
      });

      const base = await loadImage(
        path.join(__dirname, '../../assets/images/challenger.png')
      );
      const avatar = await loadImage(avatarURL);

      const canvas = createCanvas(base.width, base.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(base, 0, 0);

      let finalAvatar = avatar;

      if (silhouetted) {
        const tempCanvas = createCanvas(avatar.width, avatar.height);
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.drawImage(avatar, 0, 0);

        tempCtx.globalCompositeOperation = 'source-in';
        tempCtx.fillStyle = '#000000';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        finalAvatar = tempCanvas;
      }

      ctx.drawImage(finalAvatar, 484, 98, 256, 256);

      const buffer = canvas.toBuffer();

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      await message.channel.send({
        files: [{
          attachment: buffer,
          name: 'challenger.png'
        }]
      });

    } catch (err) {
      console.error(err);
      message.reply("Erreur lors de la génération de l'image.");
    }
  }
};

