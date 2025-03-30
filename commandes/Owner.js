const { exec } = require("child_process");
const { ovlcmd } = require("../framework/ovlcmd");
const { Bans } = require('../DataBase/ban');
const { Sudo } = require('../DataBase/sudo');
const config = require('../set');
const axios = require("axios");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const cheerio = require('cheerio');
const { WA_CONF } = require('../DataBase/wa_conf');

ovlcmd(
  {
    nom_cmd: "exec",
    classe: "Owner",
    react: "⚙️",
    desc: "Exécute une commande shell sur le serveur"
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, prenium_id } = cmd_options;

    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: "Vous n'avez pas l'autorisation d'exécuter des commandes." });
    }

    if (!arg[0]) {
      return ovl.sendMessage(ms_org, { text: "Veuillez fournir une commande shell à exécuter." });
    }

    exec(arg.join(" "), (err, stdout, stderr) => {
      if (err) {
        return ovl.sendMessage(ms_org, { text: `Erreur d'exécution: ${err.message}` });
      }
      if (stderr) {
        return ovl.sendMessage(ms_org, { text: `Erreur: ${stderr}` });
      }
      ovl.sendMessage(ms_org, { text: `Resultat: \n${stdout}` });
    });
  }
);

ovlcmd(
  {
    nom_cmd: "eval",
    classe: "Owner",
    react: "📝",
    desc: "Exécute du code JavaScript sur le serveur"
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, prenium_id } = cmd_options;

    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." });
    }
    if (!arg[0]) {
      return ovl.sendMessage(ms_org, { text: "Veuillez fournir du code JavaScript à exécuter." });
    }

    try {
      let result = await eval(arg.join(" "));
      if (typeof result === "object") {
        result = JSON.stringify(result);
      }
      ovl.sendMessage(ms_org, { text: `Résultat: \n${result}` });
    } catch (err) {
      return ovl.sendMessage(ms_org, { text: `Erreur lors de l'exécution du code JavaScript: ${err.message}` });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "ban",
    classe: "Owner",
    react: "🚫",
    desc: "Bannir un utilisateur des commandes du bot",
  },
  async (jid, ovl, cmd_options) => {
    const { repondre, arg, auteur_Msg_Repondu, prenium_id, dev_num } = cmd_options;

    try {
      if (!prenium_id) {
        return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." });
      }
      const cible =
        auteur_Msg_Repondu || 
        (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@s.whatsapp.net`);

      if (!cible) return repondre("Mentionnez un utilisateur valide à bannir.");

      if (dev_num.includes(cible)) {
      return ovl.sendMessage(jid, { text: "Vous ne pouvez pas bannir un développeur." });
      }
      const [ban] = await Bans.findOrCreate({
        where: { id: cible },
        defaults: { id: cible, type: "user" },
      });

      if (!ban._options.isNewRecord) return repondre("Cet utilisateur est déjà banni !");
      return ovl.sendMessage(jid, { 
        text: `Utilisateur @${cible.split('@')[0]} banni avec succès.`, 
        mentions: [cible]
      });
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande ban :", error);
      return repondre("Une erreur s'est produite.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "deban",
    classe: "Owner",
    react: "🚫",
    desc: "Débannir un utilisateur des commandes du bot",
  },
  async (jid, ovl, cmd_options) => {
    const { repondre, arg, auteur_Msg_Repondu, prenium_id } = cmd_options;

    try {
      if (!prenium_id) {
        return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." });
      }
      const cible =
        auteur_Msg_Repondu || 
        (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@s.whatsapp.net`);

      if (!cible) return repondre("Mentionnez un utilisateur valide à débannir.");

      const suppression = await Bans.destroy({ where: { id: cible, type: "user" } });
      if (suppression === 0) return repondre("Cet utilisateur n'est pas banni.");
      return ovl.sendMessage(jid, { 
        text: `Utilisateur @${cible.split('@')[0]} débanni avec succès.`, 
        mentions: [cible]
      });
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande debannir :", error);
      return repondre("Une erreur s'est produite.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "bangroup",
    classe: "Owner",
    react: "🚫",
    desc: "Bannir un groupe des commandes du bot",
  },
  async (jid, ovl, cmd_options) => {
    const { repondre, arg, verif_Groupe, prenium_id } = cmd_options;

    try {
      if (!prenium_id) {
        return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." });
      }
      if (!verif_Groupe) return repondre("Cette commande fonctionne uniquement dans les groupes.");

      const cible = jid;

      if (!cible) return repondre("Impossible de récupérer l'identifiant du groupe.");

      const [ban] = await Bans.findOrCreate({
        where: { id: cible },
        defaults: { id: cible, type: "group" },
      });

      if (!ban._options.isNewRecord) return repondre("Ce groupe est déjà banni !");
      return repondre(`Groupe banni avec succès.`);
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande bangroup :", error);
      return repondre("Une erreur s'est produite.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "debangroup",
    classe: "Owner",
    react: "🚫",
    desc: "Débannir un groupe des commandes du bot",
  },
  async (jid, ovl, cmd_options) => {
    const { repondre, arg, verif_Groupe, prenium_id } = cmd_options;

    try {
      if (!prenium_id) {
        return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." });
      }
      if (!verif_Groupe) return repondre("Cette commande fonctionne uniquement dans les groupes.");

      const cible = jid;

      if (!cible) return repondre("Impossible de récupérer l'identifiant du groupe.");

      const suppression = await Bans.destroy({ where: { id: cible, type: "group" } });
      if (suppression === 0) return repondre("Ce groupe n'est pas banni.");
      return repondre(`Groupe débanni avec succès.`);
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande debangroup :", error);
      return repondre("Une erreur s'est produite.");
    }
  }
);

 ovlcmd(
  {
    nom_cmd: "setsudo",
    classe: "Owner",
    react: "🔒",
    desc: "Ajoute un utilisateur dans la liste des utilisateurs premium.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, arg, auteur_Msg_Repondu, prenium_id } = cmd_options;

    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." });
    }
    const cible =
      auteur_Msg_Repondu ||
      (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@s.whatsapp.net`);

    if (!cible) {
      return repondre("Veuillez mentionner un utilisateur valide pour l'ajouter en premium.");
    }

    try {
      const [user] = await Sudo.findOrCreate({
        where: { id: cible },
        defaults: { id: cible },
      });

      if (!user._options.isNewRecord) {
        return ovl.sendMessage(ms_org, { 
        text: `L'utilisateur @${cible.split('@')[0]} est déjà un utilisateur premium.`, 
        mentions: [cible]
      });
      }

      return ovl.sendMessage(ms_org, { 
        text: `Utilisateur @${cible.split('@')[0]} ajouté avec succès en tant qu'utilisateur premium.`, 
        mentions: [cible]
      });
      } catch (error) {
      console.error("Erreur lors de l'exécution de la commande setsudo :", error);
      return repondre("Une erreur est survenue lors de l'ajout de l'utilisateur en premium.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "sudolist",
    classe: "Owner",
    react: "📋",
    desc: "Affiche la liste des utilisateurs premium.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, prenium_id } = cmd_options;

    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: "Vous n'avez pas la permission d'exécuter cette commande." });
    }

    try {
      const sudoUsers = await Sudo.findAll();

      if (!sudoUsers.length) {
        return repondre("Aucun utilisateur premium n'est actuellement enregistré.");
      }

      const userList = sudoUsers
        .map((user, index) => `🔹 *${index + 1}.* @${user.id.split('@')[0]}`)
        .join("\n");

      const message = `✨ *Liste des utilisateurs Premium* ✨\n\n*Total*: ${sudoUsers.length}\n\n${userList}`;

      return ovl.sendMessage(ms_org, { text: message, mentions: sudoUsers.map(user => user.id) });
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande sudolist :", error);
      return repondre("Une erreur est survenue lors de l'affichage de la liste des utilisateurs premium.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "delsudo",
    classe: "Owner",
    react: "❌",
    desc: "Supprime un utilisateur de la liste des utilisateurs premium.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, arg, auteur_Msg_Repondu, prenium_id } = cmd_options;
    
    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." });
    }
    const cible =
      auteur_Msg_Repondu ||
      (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@s.whatsapp.net`);

    if (!cible) {
      return repondre("Veuillez mentionner un utilisateur");
    }

    try {
      const deletion = await Sudo.destroy({ where: { id: cible } });

      if (deletion === 0) {
        return ovl.sendMessage(ms_org, { 
        text: `L'utilisateur @${cible.split('@')[0]} n'est pas un utilisateur premium.`, 
        mentions: [cible]
      });
      }

        return ovl.sendMessage(ms_org, { 
        text: `Utilisateur @${cible.split('@')[0]} supprimé avec succès de la liste premium.`, 
        mentions: [cible]
      });
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande delsudo :", error);
      return repondre("Une erreur est survenue lors de la suppression de l'utilisateur de la liste premium.");
    }
  }
);

ovlcmd(
    {
        nom_cmd: "tgs",
        classe: "Owner",
        react: "🔍",
        desc: "Importe des stickers Telegram sur WhatsApp",
    },
    async (ms_org, ovl, cmd_options) => {
        const { repondre, arg, prenium_id } = cmd_options;

         if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." });
         }
        if (!arg[0]) {
            repondre("Merci de fournir un lien de stickers Telegram valide.");
            return;
        }

        const lien = arg[0];
        const nomStickers = lien.split("/addstickers/")[1];

        if (!nomStickers) {
            repondre("Lien incorrect");
            return;
        }

        const urlAPI = `https://api.telegram.org/bot7644701915:AAGP8fIx_wv1pC7BNMpgncL4i-rRSDLlvqI/getStickerSet?name=${nomStickers}`;

        try {
            const { data } = await axios.get(urlAPI);
            const stickers = data.result.stickers;

            if (!stickers || stickers.length === 0) {
                repondre("Aucun sticker trouvé dans cet ensemble.");
                return;
            }

            repondre(`Nom du pack: ${data.result.name}\nType : ${data.result.is_animated ? "animés" : "statiques"}\nTotal : ${stickers.length} stickers\n`);

            for (const stickerData of stickers) {
                const fileInfo = await axios.get(`https://api.telegram.org/bot7644701915:AAGP8fIx_wv1pC7BNMpgncL4i-rRSDLlvqI/getFile?file_id=${stickerData.file_id}`);
                const stickerBuffer = await axios({
                    method: "get",
                    url: `https://api.telegram.org/file/bot7644701915:AAGP8fIx_wv1pC7BNMpgncL4i-rRSDLlvqI/${fileInfo.data.result.file_path}`,
                    responseType: "arraybuffer",
                });

                const sticker = new Sticker(stickerBuffer.data, {
                    pack: config.STICKER_PACK_NAME,
                    author: config.STICKER_AUTHOR_NAME,
                    type: StickerTypes.FULL,
                });

                await ovl.sendMessage(ms_org, {
                    sticker: await sticker.toBuffer(),
                });
            }

            repondre("Tous les stickers ont été envoyés.");
        } catch (error) {
            console.error(error);
            repondre("Une erreur s'est produite lors du téléchargement des stickers.");
        }
    }
);

ovlcmd(
  {
    nom_cmd: "fetch_sc",
    classe: "Owner",
    react: "💻",
    desc: "Extrait les données d'une page web, y compris HTML, CSS, JavaScript et médias",
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, prenium_id } = cmd_options;
    const lien = arg[0];
if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." });
}
    if (!lien) {
      return ovl.sendMessage(ms_org, { text: "Veuillez fournir un lien valide. Le bot extraira le HTML, CSS, JavaScript, et les médias de la page web." });
    }

    if (!/^https?:\/\//i.test(lien)) {
      return ovl.sendMessage(ms_org, { text: "Veuillez fournir une URL valide commençant par http:// ou https://" });
    }

    try {
      const response = await axios.get(lien);
      const html = response.data;
      const $ = cheerio.load(html);

      const fichiersMedia = [];
      $('img[src], video[src], audio[src]').each((i, element) => {
        let src = $(element).attr('src');
        if (src) fichiersMedia.push(src);
      });

      const fichiersCSS = [];
      $('link[rel="stylesheet"]').each((i, element) => {
        let href = $(element).attr('href');
        if (href) fichiersCSS.push(href);
      });

      const fichiersJS = [];
      $('script[src]').each((i, element) => {
        let src = $(element).attr('src');
        if (src) fichiersJS.push(src);
      });

      await ovl.sendMessage(ms_org, { text: `**Contenu HTML**:\n\n${html}` });

      if (fichiersCSS.length > 0) {
        for (const fichierCSS of fichiersCSS) {
          const cssResponse = await axios.get(new URL(fichierCSS, lien));
          const cssContent = cssResponse.data;
          await ovl.sendMessage(ms_org, { text: `**Contenu du fichier CSS**:\n\n${cssContent}` });
        }
      } else {
        await ovl.sendMessage(ms_org, { text: "Aucun fichier CSS externe trouvé." });
      }

      if (fichiersJS.length > 0) {
        for (const fichierJS of fichiersJS) {
          const jsResponse = await axios.get(new URL(fichierJS, lien));
          const jsContent = jsResponse.data;
          await ovl.sendMessage(ms_org, { text: `**Contenu du fichier JavaScript**:\n\n${jsContent}` });
        }
      } else {
        await ovl.sendMessage(ms_org, { text: "Aucun fichier JavaScript externe trouvé." });
      }

      if (fichiersMedia.length > 0) {
        await ovl.sendMessage(ms_org, { text: `**Fichiers médias trouvés**:\n${fichiersMedia.join('\n')}` });
      } else {
        await ovl.sendMessage(ms_org, { text: "Aucun fichier média (images, vidéos, audios) trouvé." });
      }

    } catch (error) {
      console.error(error);
      return ovl.sendMessage(ms_org, { text: "Une erreur est survenue lors de l'extraction du contenu de la page web." });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "antidelete",
    classe: "Owner",
    react: "🔗",
    desc: "Configure ou désactive l'Antidelete",
  },
  async (jid, ovl, cmd_options) => {
    const { ms, repondre, arg, prenium_id } = cmd_options;
    
    try {
      if (!prenium_id) {
        return repondre("Seuls les utilisateurs premium peuvent utiliser cette commande.");
      }

      const sousCommande = arg[0]?.toLowerCase();
      const validTypes = {
        1: 'pm',
        2: 'gc',
        3: 'status',
        4: 'all',
        5: 'pm/gc',
        6: 'pm/status',
        7: 'gc/status'
      };

      const [settings] = await CONF.findOrCreate({
        where: { id: jid },
        defaults: { id: jid, antidelete: 'non' },
      });

      if (sousCommande === 'off') {
        if (settings.antidelete === 'non') {
          return repondre("L'Antidelete est déjà désactivé.");
        }
        settings.antidelete = 'non';
        await settings.save();
        return repondre("L'Antidelete désactivé avec succès !");
      }

      const typeSelection = parseInt(sousCommande);
      if (validTypes[typeSelection]) {
        const selectedType = validTypes[typeSelection];

        if (settings.antidelete === selectedType) {
          return repondre(`L'Antidelete est déjà configuré sur ${selectedType}.`);
        }

        settings.antidelete = selectedType;
        await settings.save();
        return repondre(`L'Antidelete est maintenant configuré sur ${selectedType}.`);
      }

      return repondre(
        "Utilisation :\n" +
        "antidelete off: Désactiver l'antidelete\n\n" +
        "antidelete 1: Configurer l'action antidelete sur les messages privés (pm)\n" +
        "antidelete 2: Configurer l'action antidelete sur les messages de groupe (gc)\n" +
        "antidelete 3: Configurer l'action antidelete sur les statuts (status)\n" +
        "antidelete 4: Configurer l'action antidelete sur tous les types (all)\n" +
        "antidelete 5: Configurer l'action antidelete sur les messages privés et de groupe (pm/gc)\n" +
        "antidelete 6: Configurer l'action antidelete sur les messages privés et les statuts (pm/status)\n" +
        "antidelete 7: Configurer l'action antidelete sur les messages de groupe et les statuts (gc/status)"
      );
    } catch (error) {
      console.error("Erreur lors de la configuration d'antidelete :", error);
      repondre("Une erreur s'est produite lors de l'exécution de la commande.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "antivv",
    classe: "Owner",
    react: "👀",
    desc: "Active ou désactive l'antivv",
  },
  async (jid, ovl, cmd_options) => {
    const { ms, repondre, arg, prenium_id } = cmd_options;
    try {
      if (!prenium_id) {
        return repondre("Seuls les utilisateurs prenium peuvent utiliser cette commande");
      }

      const sousCommande = arg[0]?.toLowerCase();
      const validtypes = ['on', 'off'];

      const [settings] = await CONF.findOrCreate({
        where: { id: jid },
        defaults: { id: jid, antivv: 'non' },
      });

      if (validtypes.includes(sousCommande)) {
        const newMode = sousCommande === 'on' ? 'oui' : 'non';

        if (settings.antivv === newMode) {
          return repondre(`L'Antivv est déjà réglé sur ${sousCommande === 'on' ? 'activé' : 'désactivé'}`);
        }

        settings.antivv = newMode;
        await settings.save();
        return repondre(`L'Antivv ${sousCommande === 'on' ? 'activé' : 'désactivé'} avec succès !`);
      }

      return repondre("Utilisation :\n" +
        "antivv on/off: Activer ou désactiver l'antivv");
    } catch (error) {
      console.error("Erreur lors de la configuration d'antivv :", error);
      repondre("Une erreur s'est produite lors de l'exécution de la commande.");
    }
  }
);
