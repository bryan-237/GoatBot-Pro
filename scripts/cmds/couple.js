const { createCanvas, loadImage } = require('@napi-rs/canvas');
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

async function downloadFile(url, filePath) {
  const response = await axios({ method: 'GET', url: url, responseType: 'stream' });
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function makeImage({ one, two }) {
  const __root = path.resolve(__dirname, "cache");
  await fs.ensureDir(__root);
  const backgroundPath = path.resolve(__dirname, '../../assets/img/couple.jpeg');
  const avatarOnePath = __root + `/avt_${one}.png`;
  const avatarTwoPath = __root + `/avt_${two}.png`;
  const outputPath = __root + `/couple_${one}_${two}_${Date.now()}.png`;

  try {
    // Download Facebook profile pictures
    const avatarOneUrl = `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const avatarTwoUrl = `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    
    const avatarOneResponse = await axios.get(avatarOneUrl, { responseType: 'arraybuffer' });
    const avatarTwoResponse = await axios.get(avatarTwoUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(avatarOnePath, Buffer.from(avatarOneResponse.data));
    fs.writeFileSync(avatarTwoPath, Buffer.from(avatarTwoResponse.data));

    // Load images
    const backgroundImg = await loadImage(backgroundPath);
    const avatarOneImg = await loadImage(avatarOnePath);
    const avatarTwoImg = await loadImage(avatarTwoPath);

    // Create canvas
    const canvas = createCanvas(1024, 712);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.drawImage(backgroundImg, 0, 0, 1024, 712);

    // Function to draw circular avatar
    function drawCircularAvatar(img, x, y, size) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
    }

    // Draw avatars in circular shape - MÊME POSITIONS QUE TOI
    drawCircularAvatar(avatarOneImg, 527, 141, 200); // First avatar
    drawCircularAvatar(avatarTwoImg, 389, 407, 200); // Second avatar

    // Add decorative hearts
    drawHeart(ctx, 600, 100, 30);
    drawHeart(ctx, 450, 500, 25);
    drawHeart(ctx, 650, 300, 20);

    // Save the result
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    // Clean up
    fs.unlinkSync(avatarOnePath);
    fs.unlinkSync(avatarTwoPath);
    return outputPath;

  } catch (error) {
    console.error('Error creating couple image:', error);
    try {
      if (fs.existsSync(avatarOnePath)) fs.unlinkSync(avatarOnePath);
      if (fs.existsSync(avatarTwoPath)) fs.unlinkSync(avatarTwoPath);
    } catch (cleanupError) {}
    throw error;
  }
}

// Helper function to draw heart shape - MÊME CODE QUE TOI
function drawHeart(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  ctx.beginPath();
  ctx.moveTo(50, 35);
  ctx.bezierCurveTo(50, 35, 0, 47, 0, 65);
  ctx.bezierCurveTo(0, 80, 25, 100, 50, 120);
  ctx.bezierCurveTo(75, 100, 100, 80, 100, 65);
  ctx.bezierCurveTo(100, 47, 50, 35, 50, 35);
  ctx.closePath();
  ctx.restore();
}

module.exports = {
  config: {
    name: "couple",
    version: "2.1.0",
    author: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Couple pic maker" },
    description: { en: "Generate couple picture with 2 avatars" },
    category: "love",
    guide: { en: "{pn} @tag or {pn} @mention" }
  },

  onStart: async function ({ event, api, args, message, usersData }) {
    const { threadID, messageID, senderID, mentions } = event;
    
    const mentionID = Object.keys(mentions)[0];
    if (!mentionID) {
      return message.reply("💕 Couple image bananor jonno ekjon ke tag korben!\n\n📝 Use: couple [@mention]");
    }

    let tag = mentions[mentionID].replace("@", "");
    const one = senderID, two = mentionID;

    // Loading message
    const loadingMsg = await message.reply("💕 Apnar jonno beautiful couple image banano hocche...");

    try {
      const imgPath = await makeImage({ one, two });
      await api.unsendMessage(loadingMsg.messageID);
      
      return api.sendMessage({
        body: `💕 Apnar Couple Photo!\n\n👤 Tagged: @${tag}`,
        mentions: [{ tag: tag, id: mentionID }],
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => fs.unlinkSync(imgPath), messageID);

    } catch (error) {
      await api.unsendMessage(loadingMsg.messageID);
      console.error('Couple image creation failed:', error);
      return message.reply("❌ Image bananor somoy ekti error hoise. abar try korben!");
    }
  }
};
