/* Authors: Mirai-Miki
 * Version: 0.1.0
 */

const fs = require("fs");
const config = require("./config.json");

const Discord = require("discord.js");
const Database = require("./modules/Database.js");

const client = new Discord.Client();

////////////////////////////////// Constants //////////////////////////////////

////////////////////////////////// Functions //////////////////////////////////

function new_char(mess) {
    let cmd = mess.content;

    if (!cmd.match(/^\/(n|new)\s+\w+\s+/i) ||
        !cmd.match(/(hm|humanity)=\d+/i) ||
        !cmd.match(/(w|will|willpower)=\d+/i) || 
        !cmd.match(/(d|damage|health)=\d+/i)) {
        // comand is incorect
        mess.channel.send("Command is incorrect")
        return;
    }

    let name = cmd.match(/^\/(n|new)\s+\w+/i)[0]
        .replace(/^\/(n|new)\s+/i, '');
    let humanity = parseInt(cmd.match(/(hm|humanity)=\d+/i)[0]
        .replace(/(hm|humanity)=/i, ''));
    let willpower = parseInt(cmd.match(/(w|will|willpower)=\d+/i)[0]
        .replace(/(w|will|willpower)=/i, ''));
    let health = parseInt(cmd.match(/(d|damage|health)=\d+/i)[0]
        .replace(/(d|damage|health)=/i, ''));

    let guild = undefined;
    if (mess.guild) {
        guild = mess.guild.id;
    }

    let char = {
        'name': name,
        'user': mess.author.id,
        'guild': guild,
        'colour': [Math.floor(Math.random() * 256), 
            Math.floor(Math.random() * 256), 
            Math.floor(Math.random() * 256)],
        'humanity': humanity,
        'stains': 0,
        'willpower': willpower,
        'supWill': 0,
        'aggWill': 0,
        'health': health,
        'supHealth': 0,
        'aggHealth': 0,
        'hunger': 1,
    };

    let db = new Database();
    db.open(`database`);
    if (db.new(mess.author.id+name.toLowerCase(), char)) {
        mess.channel.send("Char already exists");
    }
    
    if(db.close()) {
        console.error(`File did not save correctly. Guild: ${mess.guild.id}`);
        mess.channel.send("Error saving new character please try agian.");
        return;
    } else {
        sendCharacter(mess, char)
    }
}

function update_char(mess) {
    let cmd = mess.content;

    if (!cmd.match(/^\/(u|update)\s+\w+\s+/i)) {
        mess.channel.send("Error Command is missing a character name.");
        return;
    }

    if (!cmd.match(/\s(hm|humanity)=\d+/i) &&
        !cmd.match(/\s(s|stain|stains)=(\+|-)?\d+/i) &&
        !cmd.match(/\s(w|will|willpower)=\d+/i) &&
        !cmd.match(/\s(sw|swill|swillpower|supw|supwill|supwillpower)=(\+|-)?\d+/i) &&
        !cmd.match(/\s(aw|aggw|aggwill|aggwillpower)=(\+|-)?\d+/i) && 
        !cmd.match(/\s(d|damage|health)=\d+/i) &&
        !cmd.match(/\s(sd|sdamage|sh|shealth|suph|suphealth|supd|supdamage)=(\+|-)?\d+/i) &&
        !cmd.match(/\s(ad|aggd|aggdamage|ah|aggh|agghealth)=(\+|-)?\d+/i) &&
        !cmd.match(/\s(h|hunger)=(\+|-)?\d+/i)) {
        // comand is incorect
        mess.channel.send("Command is incorrect. Please check for typos or "+
            "missing keys.");
        return;
    }

    let overflow = {
        "stains": 0,
        "hunger": 0,
    }

    let name = cmd.match(/^\/(u|update)\s+\w+/i)[0]
        .replace(/^\/(u|update)\s+/i, '');

    let db = new Database();
    db.open('database');
    let char = db.find(mess.author.id+name.toLowerCase());
    if (!char) {
        mess.channel.send("Character does not exist.");
        return;
    }

    if (cmd.match(/\s(hm|humanity)=\d+/i)) {   
        // Humanity Tracker 
        let humanity = parseInt(cmd.match(/\s(hm|humanity)=\d+/i)[0]
            .replace(/\s(hm|humanity)=/i, ''));

        if (humanity > 10 || humanity < 0) {
            mess.channel.send("Error: Humanity out of range."+
            "\nHumanity must be between 0 and 10 and should be the number "+
            "you wish to change to.\nexample: If you want humanity to equal"+
            " 4 the key is humanity=4");
            return;
        }

        char.humanity = humanity;
        char.stains = 0;
    }

    if (cmd.match(/\s(w|will|willpower)=\d+/i)) {    
        // Willpower Tracker
        let willpower = parseInt(cmd.match(/\s(w|will|willpower)=\d+/i)[0]
            .replace(/\s(w|will|willpower)=/i, ''));

        if (willpower > 15 || willpower < 1) {
            mess.channel.send("Error: Willpower out of range."+
            "\nWillpower must be between 1 and 15 and should be the number "+
            "you wish to change to.\nexample: If you want willpower to equal"+
            " 4 the key is willpower=4");
            return;
        }

        char.willpower = willpower;
        // Checks to ensure nothing no damage is ever higher then the tracker
        // and to ensure nothing drops below 0
        if (char.supWill > (char.willpower - char.aggWill)) {
            char.supWill = (char.willpower - char.aggWill);
            if (char.supWill < 0) {
                char.supWill = 0;
            }
        }
        if (char.aggWill > (char.willpower - char.supWill)) {
            char.aggWill = (char.willpower - char.supWill);
            if (char.aggWill < 0) {
                char.aggWill = 0;
            }
        }
    }

    if (cmd.match(/\s(d|damage|health)=\d+/i)) {   
        // Health Tracker 
        let health = parseInt(cmd.match(/\s(d|damage|health)=\d+/i)[0]
            .replace(/\s(d|damage|health)=/i, ''));

        if (health > 20 || health < 1) {
            mess.channel.send("Error: Health out of range."+
            "\Health must be between 1 and 20 and should be the number "+
            "you wish to change to.\nexample: If you want Health to equal"+
            " 4 the key is health=4");
            return;
        }
    
        char.health = health;
        // Checks to ensure nothing no damage is ever higher then the tracker
        // and to ensure nothing drops below 0
        if (char.supHealth > (char.health - char.aggHealth)) {
            char.supHealth = (char.health - char.aggHealth);
            if (char.supHealth < 0) {
                char.supHealth = 0;
            }
        }
        if (char.aggHealth > (char.health - char.supHealth)) {
            char.aggHealth = (char.health - char.supHealth);
            if (char.aggHealth < 0) {
                char.aggHealth = 0;
            }
        }
    }

    if (cmd.match(/\s(s|stain|stains)=(\+|-)?\d+/i)) {
        // Stains Count   
        let stains = parseInt(cmd.match(/\s(s|stain|stains)=(\+|-)?\d+/i)[0]
            .replace(/\s(s|stain|stains)=/i, ''));
        
        if (stains > (10 - char.humanity - char.stains)) {
            // cannot be more then 10 - humanity level
            overflow.stains = 
                stains - (10 - char.humanity - char.stains);
            char.stains = (10 - char.humanity);
        } else if (stains == 0) {
            char.stains = 0;
        } else {  
            char.stains += stains;          
            if (char.stains < 0) {
                char.stains = 0;
            }
        }
    }

    if (cmd.match(/\s(sw|swill|swillpower|supw|supwill|supwillpower)=(\+|-)?\d+/i)) {
        // Superficial Willpower Damage Count
        let damage = parseInt(cmd.match
            (/\s(sw|swill|swillpower|supw|supwill|supwillpower)=(\+|-)?\d+/i)[0]
            .replace(/\s(sw|swill|swillpower|supw|supwill|supwillpower)=/i, ''));
        
        let temp = takeSuperficialDamage(damage, char.willpower, char.supWill, 
            char.aggWill);
        char.supWill = temp[0];
        char.aggWill = temp[1];
    }

    if (cmd.match(/\s(aw|aggw|aggwill|aggwillpower)=(\+|-)?\d+/i)) {
        // Aggravated Willpower Damage count
        let damage = parseInt(
            cmd.match(/\s(aw|aggw|aggwill|aggwillpower)=(\+|-)?\d+/i)[0]
            .replace(/\s(aw|aggw|aggwill|aggwillpower)=/i, ''));

        let temp = takeAggDamage(damage, char.willpower, char.supWill, 
            char.aggWill);
        char.supWill = temp[0];
        char.aggWill = temp[1];
    }

    if (cmd.match(/\s(sd|sdamage|sh|shealth|suph|suphealth|supd|supdamage)=(\+|-)?\d+/i)) {
        // Superfical Health Damage Count
        let damage = parseInt(cmd.match
            (/\s(sd|sdamage|sh|shealth|suph|suphealth|supd|supdamage)=(\+|-)?\d+/i)[0]
            .replace(/\s(sd|sdamage|sh|shealth|suph|suphealth|supd|supdamage)=/i, ''));
        
        let temp = takeSuperficialDamage(damage, char.health, char.supHealth, 
            char.aggHealth);        
        char.supHealth = temp[0];
        char.aggHealth = temp[1];
    }

    if (cmd.match(/\s(ad|aggd|aggdamage|ah|aggh|agghealth)=(\+|-)?\d+/i)) {
        // Aggravated Health Damage Count
        let damage = parseInt(
            cmd.match(/\s(ad|aggd|aggdamage|ah|aggh|agghealth)=(\+|-)?\d+/i)[0]
            .replace(/\s(ad|aggd|aggdamage|ah|aggh|agghealth)=/i, ''));
        
        let temp = takeAggDamage(damage, char.health, char.supHealth, 
            char.aggHealth);
        char.supHealth = temp[0];
        char.aggHealth = temp[1];
    }
    
    if (cmd.match(/\s(h|hunger)=(\+|-)?\d+/)) {
        // Hunger Tracker
        let hunger = parseInt(cmd.match(/\s(h|hunger)=(\+|-)?\d+/)[0]
            .replace(/\s(h|hunger)=/, ''));
        
        char.hunger += hunger;
        if (char.hunger > 5) {
            overflow.hunger = (char.hunger - 5);
            char.hunger = 5;
        } else if (char.hunger < 0) {
            char.hunger = 0;
        }
    }
    sendCharacter(mess, char, overflow);
    db.close();
}

function find_char(mess) {
    let cmd = mess.content;

    if (!cmd.match(/^\/(f|find)\s+\w+$/i)) {
        mess.channel.send("Error Command is missing a character name.");
        return;
    }

    let name = cmd.match(/^\/(f|find)\s+\w+$/i)[0]
        .replace(/^\/(f|find)\s+/i, '');

    let db = new Database();
    db.open(`database`);
    let char = db.find(mess.author.id+name.toLowerCase());
    if (char) {
        sendCharacter(mess, char);
    } else {
        mess.channel.send("No character with this name exists " +
            "or this is not your character.");
    }
}

function del_char(mess) {
    let cmd = mess.content;

    if (!cmd.match(/^\/(d|delete)\s+\w+$/i)) {
        // comand is incorect
        mess.channel.send("Error Command is missing a character name.")
        return;
    }

    let name = cmd.match(/^\/(d|delete)\s+\w+$/i)[0]
        .replace(/^\/(d|delete)\s+/i, '');

    let db = new Database();
    db.open(`database`);
    
    if (db.delete(mess.author.id+name.toLowerCase())) {
        mess.channel.send("No character with this name exists " +
            "or this is not your character.");
    } else {
        mess.channel.send(`Deleteted: ${name}`);
    }
    
    if(db.close()) {
        console.error(`File did not save correctly. Guild: ${mess.guild.id}`)
    }    
}

function help(mess) {
    mess.channel.send("**Commands**\n" +
        "New Character: `/new name willpower=num health=num " +
        "humanity=num` or `/new name (keys)`\n" +
        "Update Character: `/update name (keys)` or `/u name (keys)`\n" +
        "Find Character: `/find name` or `/f name`\n" +
        "Delete Character: `/delete name` or `/d name`\n\n" +
        "**Keys**\nHumanity: `hm` | `humanity`\n" +
        "Stains: `s` | `stain` | `stains`\n" +
        "Willpower: `w` | `will` | `willpower`\n" +
        "Superficial Willpower: `sw` | `swill` | `swillpower` | `supw` " +
        "| `supwill` | `supwillpower`\n" +
        "Aggravated Willpower: `aw` | `aggw` | `aggwill` | `aggwillpower`\n" +
        "Health: `d` | `damage` | `health`\n" +
        "Superficial Health: `sd` | `sdamage` | `sh` | `shealth` | `suph` " +
        "| `suphealth` | `supd` | `supdamage`\n" +
        "Aggravated Health: `ad` | `aggd` | `aggdamage` | `ah` | `aggh`" +
        " | `agghealth`\n" +
        "Hunger: `h` | `hunger`\n\n" +
        "**Notes**\nThe keys Willpower, Health and Humanity are required to" +
        " make a character and take absolute values " +
        "eg. if you want willpower to be equal to 4 the command is `w=4`.\n" +
        "All other keys take +/- values and only work with the update " +
        "command. eg. If i want to remove 1 agg willpower damage the command" +
        " is `aw=-1`");
}

/*
 * Takes a number of superficial damage and adds it to a characters trackers
 * Can take a negative number to remove superficial damage instead.
 * Taking more superficial damage then available will convert the exess into
 * aggravated damage.
 * 
 * #damage: number of damage taken. Can be negative.
 * 
 * #charMax: Characters damage tracker
 * 
 * #charSup: Characters superficial damage tracker
 * 
 * #charAgg: Characters Aggravated damage tracker
 * 
 * return: Returns an arrary containing supDamage and aggDamage
 */
function takeSuperficialDamage(damage, charMax, charSup, charAgg) {
    if (damage > (charMax - charAgg - charSup)) {
        // taking more superficial damage then is available
        // take agg damage as well.
        charAgg += (damage - (charMax - charAgg - charSup));
        if (charAgg > charMax) {
            charAgg = charMax;
        }      
        charSup = (charMax - charAgg);
    } else {
        // will not go over does not matter if it goes under.
        charSup += damage;
        if (charSup < 0) {
            charSup = 0;
        }
    }
    return [charSup, charAgg];
}

/*
 * Takes a number of aggravted damage and adds it to a characters trackers
 * Can take a negative number to remove aggravted damage instead.
 * Taking more aggravted damage then available will convert the exess damage
 * from superficial into aggravated damage.
 * 
 * #damage: number of damage taken. Can be negative.
 * 
 * #charMax: Characters damage tracker
 * 
 * #charSup: Characters superficial damage tracker
 * 
 * #charAgg: Characters Aggravated damage tracker
 * 
 * return: Returns an arrary containing supDamage and aggDamage
 */
function takeAggDamage(damage, charMax, charSup, charAgg) {
    if (damage > (charMax - charAgg - charSup)) {
        // taking more agg damage then undamaged available
        // convert superficial damage to agg for exess
        charSup -= (damage - (charMax - charAgg - charSup));
        if (charSup < 0) {
            charSup = 0;
        }
        charAgg = (charMax - charSup);
    } else {
        // will not go over does not matter if it goes under.
        charAgg += damage;
        if (charAgg < 0) {
            charAgg = 0;
        }
    }
    return [charSup, charAgg];
}

function sendCharacter(recvMess, char, overflow=null) {
    let name;
    if (recvMess.member) {
        name = recvMess.member.nickname;
        if (!name) {
            name = (`${recvMess.author.username}`+
                `#${recvMess.author.discriminator}`);
        }
    }

    let stainsOverflow = "";
    let hungerOverflow = "";
    let willImpairment = "";
    let healthImpairment = "";

    if (!(char.health - char.supHealth - char.aggHealth)) {
        healthImpairment = " You are currently Impaired. p126";
    }

    if (!(char.willpower - char.supWill - char.aggWill)) {
        willImpairment = " You are currently Impaired. p126";
    }

    if (char.hunger == 5) {
        hungerOverflow = ` Hunger is currently 5` +
            ". You can no longer intentionally rouse the blood. p211"
    }

    if (overflow) {
        if (overflow.stains == 1) {
            stainsOverflow = ` ${overflow.stains} stain overflowed.` +
                " You are now in Degeneration. p239";
        } else if (overflow.stains) {
            stainsOverflow = ` ${overflow.stains} stains overflowed.` +
                " You are now in Degeneration. p239";
        }

        if (overflow.hunger > 0) {
            hungerOverflow = ` ${overflow.hunger} hunger has ` +
                "overflowed. You should now do a hunger frenzy check. p220"
        }       
    }

    
    const mess = new Discord.MessageEmbed()
        .setColor(char.colour)
        .setAuthor(name, recvMess.author.avatarURL())
        .setTitle(char.name)
        .addField("Willpower", 
            (damageTracker(char.willpower, char.supWill, char.aggWill) +
                willImpairment),
            false)
        .addField("Health", 
            (damageTracker(char.health, char.supHealth, char.aggHealth) +
                healthImpairment),
            false)
        .addField("Humanity", 
            (humanityTracker(char.humanity, char.stains) + stainsOverflow),
            false)
        .addField("Hunger", 
            (hungerTracker(char.hunger) + hungerOverflow),
            false)

    recvMess.channel.send(mess);
}

function damageTracker(max, supDamage, aggDamage) {
    let tracker = "[";
    let undamaged = (max - supDamage - aggDamage);
    for (let i = 0; i < max; i++) {
        if (i == 5 || i == 10 || i == 15) {
            tracker += " ";
        }

        if (undamaged) {
            tracker += "■";
            undamaged--;
        } else if (aggDamage) {
            tracker += "X";
            aggDamage--;
        } else if (supDamage) {
            tracker += "/";
        } else {
            console.error("Error in damageTracker()");
        }
    }
    tracker += "]"
    return tracker;
}

function humanityTracker(max, stains) {
    let tracker = "[";
    let undamaged = (10 - max - stains);
    for (let i = 0; i < 10; i++) {
        if (i == 5) {
            tracker += " ";
        }

        if (max) {
            tracker += "■";
            max--;
        } else if (undamaged) {
            tracker += "•";
            undamaged--;
        } else if (stains) {
            tracker += "/";
        } else {
            console.error("Error in damageTracker()");
        }
    }
    tracker += "]"
    return tracker;
}

function hungerTracker(hunger) {
    let tracker = "[";
    for (let i = 0; i < hunger; i++) {
        tracker += "•"
    }
    tracker += "]"
    return tracker;
}
/////////////////////////////////// Classes ///////////////////////////////////

////////////////////////////////// Main Loop //////////////////////////////////

client.on("ready", () => {
    console.log("Connected as: " + client.user.tag);
    client.user.setActivity('VTM v5', { type: 'PLAYING' });
});

client.on('message', (mess) => {
    if (mess.author.bot) {
        // Prevent bot from responding to other bots
        return;
    } 
    
    else if (!mess.guild) {
        // prevent messages being DMed to the bot
        mess.author.send("Commands must be sent from a server.")
    } 
    
    else if (mess.content.match(/^\/n |^\/new /i)) {
        // Create new character
        new_char(mess);
    } 
    
    else if (mess.content.match(/^\/u |^\/update /i)) {
        // Update existing Character
        update_char(mess);
    }
    
    else if (mess.content.match(/^\/f |^\/find /i)) {
        // Find a character
        find_char(mess);
    } 
    
    else if (mess.content.match(/^\/d |^\/delete /i)) {
        // Delete an existing character
        del_char(mess);
    } 
    
    else if (mess.content.match(/^\/h$|^\/help$/i)) {
        help(mess);
    }
});

// Logs into the server using the secret token
botToken = config.token;
client.login(botToken);