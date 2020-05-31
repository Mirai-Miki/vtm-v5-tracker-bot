/* Authors: Mirai-Miki
 * Version: 0.0.0
 */

const fs = require("fs");
const config = require("./config.json");

const Discord = require("discord.js");
const Database = require("./modules/Database.js");

const client = new Discord.Client();