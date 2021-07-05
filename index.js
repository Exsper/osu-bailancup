const CupManager = require("./src/CupManager");
const Settings = require("./settings.json");

let cupManager = new CupManager(Settings);

console.log("指令列表：");
console.log("add [玩家名] 添加选手： add peppy");
console.log("del [玩家名] 删除选手： del peppy");
console.log("ra 显示选手recent排行（acc排序）");
console.log("rc 显示选手recent排行（combo排序）");
console.log("rs 显示选手recent排行（score排序）");

const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.on("line", async (line) => {
    if (line.startsWith("add")) {
        cupManager.addPlayer(line.substring(3).trim());
    }
    else if (line.startsWith("del")) {
        cupManager.delPlayer(line.substring(3).trim());
    }
    else if (line === "ra") {
        await cupManager.showResult("acc");
    }
    else if (line === "rc") {
        await cupManager.showResult("combo");
    }
    else if (line === "rs") {
        await cupManager.showResult("score");
    }
});
