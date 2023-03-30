const Discord = require("discord.js");
const sourcebin = require('sourcebin');
const config = require("./config.json");
const fs = require('fs');
const { QuickDB } = require("quick.db");
const { JsonDatabase } = require("wio.db");

// Database
global.db = new QuickDB();
global.dbJson = new JsonDatabase({
    databasePath: "./databases/myJsonDatabase.json"
});
//--

const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessageReactions,
        '32767'
    ]
});

module.exports = client

client.on('interactionCreate', (interaction) => {

    if (interaction.type === Discord.InteractionType.ApplicationCommand) {

        const cmd = client.slashCommands.get(interaction.commandName);

        if (!cmd) return interaction.reply({ content: `Erro, este comando não existe`, ephemeral: true });

        interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);

        cmd.run(client, interaction)
        
    }
});

client.on("ready", () => {
    client.user.setUsername(config.client.username).catch((error) => {
        console.log('❌ Não foi possível alterar o nome do bot neste momento.')
    });
    client.user.setAvatar(config.client.avatar).catch((error) => { });

    console.log(`👋 Hello world`)
    console.log(`🤖 My name is ${client.user.username}`)
    console.log(`💔 I have ${client.users.cache.size} friends`)
    console.log(`👨 More than ${client.guilds.cache.size} groups support me.`)
});

/*============================= | Anti OFF | =========================================*/

// process.on('multipleResolves', (type, reason, promise) => {
//     return;
// });
// process.on('unhandRejection', (reason, promise) => {
//     return;
// });
// process.on('uncaughtException', (error, origin) => {
//     return;
// });
// process.on('uncaughtException', (error, origin) => {
//     return;
// });


/*============================= | STATUS RICH PRESENCE | =========================================*/

client.on("ready", () => {
    let react = [
        `🤖 Duvidas?`,
        `🤖 ajuda`,
        `🎫 ticket`,
        `🥳 www.leinadshop.com.br`,
        `🏡 Created By Leinad Community`,
        `🌐 Version: v${require('discord.js').version.slice(0, 6)}`
    ],
        fera = 0;
    setInterval(() => client.user.setPresence({
        activities: [{
            name: `${react[fera++ % react.length]}`,
            type: Discord.ActivityType.Streaming,
            url: 'https://www.youtube.com/watch?v=a3DxVqMwUAQ'
        }]
    }), 1000 * 10);

    client.user
        .setStatus("online");
});


/*============================= | Import handler | =========================================*/

client.slashCommands = new Discord.Collection()

require('./handler')(client)

client.login(config.client.token)

client.on('interactionCreate', require('./events/createProduct').execute)
client.on('interactionCreate', require('./events/showProduct').execute)
client.on('interactionCreate', require('./events/startCheckout').execute)
client.on('interactionCreate', require('./events/addStockProducts').execute)
client.on('interactionCreate', require('./events/editProduct').execute)

/*============================= | UPDATE PRODUCT | =========================================*/
setInterval(async () => {
    var row = await db.all();
    row = row.filter(p => p.id.startsWith('product_'));

    row.forEach(async product => {
        if (!product.value.channel) return;

        const channel = await client.channels.cache.get(product.value.channel.channelId)
        const message = await channel.messages.fetch(product.value.channel.messageId).catch(() => { })

        try {
            message.edit({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)
                        .setTitle(channel.guild.name)
                        .setThumbnail(channel.guild.iconURL({ dynamic: true, format: "png", size: 4096 }))
                        .setDescription(`\`\`\`yaml\n${product.value.body}\`\`\` \n**<a:__:1087185474570944562>・Nome:** \`${product.value.name}\`\n**<a:905500128532656190:1088171593227833435>・Preço:** \`R$${product.value.value.toFixed(2)}\`\n**<:__:1087185810358554665>・Estoque:** \`${product.value.stocks ? product.value.stocks.length : 0}\``)
                        .setFooter({ text: `Para comprar clique no botão comprar` })
                ],
                components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`sales-${product.value.id}`)
                                .setStyle(2)
                                .setEmoji('🛒')
                                .setLabel('Comprar')
                        )
                ]
            })
        } catch (error) {

        }
    });
}, 60000);