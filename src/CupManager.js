const OsuApi = require("./api/OsuApi");

class Player {
    /**
     * @param {string} username 
     * @param {string} userId 
     */
    constructor(username, userId) {
        this.username = username;
        this.userId = userId;
    }
}

class PlayerList {
    constructor() {
        /**
         * @type {Array<Player>}
         */
        this.list = [];
    }

    /**
     * @param {string} user 
     * @returns {Player}
     */
    getPlayer(user) {
        user = user.trim().toLowerCase();
        let find = this.list.find((player) => {
            return (player.username.toLowerCase() === user || player.userId === user);
        });
        if (!find) return null;
        else return find;
    }

    /**
     * @param {string} userId 
     * @returns {Player}
     */
    getPlayerById(userId) {
        let find = this.list.find((player) => {
            return (player.userId === userId);
        });
        if (!find) return null;
        else return find;
    }

    /**
     * @param {string} username 
     * @param {string} userId 
     */
    addPlayer(username, userId) {
        if (this.getPlayerById(userId)) return console.log("列表中已有该选手");
        this.list.push(new Player(username, userId));
    }

    /**
     * @param {string} user 
     */
    delPlayer(user) {
        user = user.trim().toLowerCase();
        let findIndex = this.list.findIndex((player) => {
            return (player.username.toLowerCase() === user || player.userId === user);
        });
        if (findIndex < 0) return console.log("列表中不存在该选手");
        else this.list.splice(findIndex, 1);
    }

    /**
     * @returns {string}
     */
    toString() {
        let players = this.list.map((player) => player.username);
        return "当前选手列表：" + players.join(", ");
    }

}

class ScoreSimple {
    /**
     * @param {Score} score 
     */
    constructor(score) {
        /**@type {string} */
        this.username = score.player.username;
        /**@type {string} */
        this.beatmap_id = score.beatmap_id;
        /**@type {number} */
        this.score = score.score;
        /**@type {number} */
        this.combo = score.maxcombo;
        /**@type {number} */
        this.acc = score.calACC();
        /**@type {boolean} */
        this.isFail = (score.rank === "F");
    }
}

class ScoreOutputer {
    /**
     * @param {Array<ScoreSimple>} scoreSimples 
     * @param {"acc"|"combo"|"score"} method
     */
    constructor(scoreSimples, method = "score") {
        /**@type {Array<ScoreSimple>} */
        this.scoreSimples = scoreSimples;
        /**@type {string} */
        this.method = method;
    }

    isSameBeatmap() {
        let beatmapIds = this.scoreSimples.map((ss) => ss.beatmap_id);
        let filted = [...new Set(beatmapIds)];
        return (filted.length === 1);
    }

    isAllFail() {
        let isFails = this.scoreSimples.map((ss) => ss.isFail);
        let filted = [...new Set(isFails)];
        return (filted.length === 1 && filted[0] === true);
    }

    getLongestWordLength(words) {
        let num = 0
        for (let i = 0; i < words.length; i++) {
            if (words[i].length > num) num = words[i].length;
        }
        return num;
    }

    // 整数每3位加逗号
    /**
     * @param {number} n 
     * @returns {string}
     */
    format_number(n) {
        var b = parseInt(n).toString();
        var len = b.length;
        if (len <= 3) { return b; }
        var r = len % 3;
        return r > 0 ? b.slice(0, r) + "," + b.slice(r, len).match(/\d{3}/g).join(",") : b.slice(r, len).match(/\d{3}/g).join(",");
    }

    getSpaces(num) {
        let bnum = parseInt(num / 2);
        let snum = num % 2;
        let output = "";
        for (let i = 0; i < bnum; i++) {
            output += "　";
        }
        if (snum > 0) output += " ";
        return output;
    }

    getLines(num) {
        let output = "";
        for (let i = 0; i < num; i++) {
            output += "=";
        }
        return output;
    }

    output() {
        let needBeatmap = !this.isSameBeatmap();
        let output = "成绩列表：\n";
        if (this.isAllFail()) {
            // 全部失败，反转模式，大的获胜排在前
            if (this.method === "score") this.scoreSimples.sort((a, b) => b.score - a.score);
            else if (this.method === "combo") this.scoreSimples.sort((a, b) => b.combo - a.combo);
            else if (this.method === "acc") this.scoreSimples.sort((a, b) => b.acc - a.acc);
        }
        else {
            // fail直接失败，其他按小的排在前
            let winers = this.scoreSimples.filter((ss) => !ss.isFail);
            let losers = this.scoreSimples.filter((ss) => ss.isFail);
            if (this.method === "score") winers.sort((a, b) => a.score - b.score);
            else if (this.method === "combo") winers.sort((a, b) => a.combo - b.combo);
            else if (this.method === "acc") winers.sort((a, b) => a.acc - b.acc);
            this.scoreSimples = [...winers, ...losers];
        }
        // 遍历scoreSimples，各项格式化并获取最大长度
        let username_Length = 0;
        let score_Length = 0;
        let combo_Length = 0;
        let acc_Length = 0;
        let outputScores = this.scoreSimples.map((ss) => {
            let os = {};
            os.username = ss.username;
            if (os.username.length > username_Length) username_Length = os.username.length;
            os.score = this.format_number(ss.score);
            if (os.score.length > score_Length) score_Length = os.score.length;
            os.combo = ss.combo + "x";
            if (os.combo.length > combo_Length) combo_Length = os.combo.length;
            os.acc = ss.acc.toFixed(2) + "%";
            if (os.acc.length > acc_Length) acc_Length = os.acc.length;
            os.stat = (ss.isFail) ? " FAILED " : " ALIVE ";
            os.beatmap_id = ss.beatmap_id;
            return os;
        });
        if (needBeatmap) {
            output += "注意：获取到谱面不相同！\n";
            output += "玩家名" + this.getSpaces(username_Length - 3) + "score" + this.getSpaces(score_Length - 4) + "combo" + this.getSpaces(combo_Length - 4) + " acc" + this.getSpaces(acc_Length - 4) + "　STAT　" + " BeatmapId\n";
            output += this.getLines(username_Length + score_Length + combo_Length + acc_Length + 24) + "\n";
            outputScores.map((os) => {
                output += os.username + this.getSpaces(username_Length - os.username.length + 2) + os.score + this.getSpaces(score_Length - os.score.length + 2) + os.combo + this.getSpaces(combo_Length - os.combo.length + 2) + os.acc + this.getSpaces(acc_Length - os.acc.length + 2) + os.stat + os.beatmap_id + "\n";
            });
        }
        else {
            output += "玩家名" + this.getSpaces(username_Length - 2) + "score" + this.getSpaces(score_Length - 4) + "combo" + this.getSpaces(combo_Length - 4) + " acc" + this.getSpaces(acc_Length - 4) + "\n";
            output += this.getLines(username_Length + score_Length + combo_Length + acc_Length + 15) + "\n";
            outputScores.map((os) => {
                output += os.username + this.getSpaces(username_Length - os.username.length + 2) + os.score + this.getSpaces(score_Length - os.score.length + 2) + os.combo + this.getSpaces(combo_Length - os.combo.length + 2) + os.acc + this.getSpaces(acc_Length - os.acc.length + 2) + os.stat + "\n";
            });
        }
        return output;
    }
}

class Score {
    /**
     * @param {Object} data 
     * @param {Player} player 
     * @param {number} mode 
     */
    constructor(data, player, mode) {
        /**@type {Player} */
        this.player = player;
        /**@type {number} */
        this.mode = mode;
        /**@type {string} */
        this.beatmap_id = data.beatmap_id;
        /**@type {number} */
        this.score = parseInt(data.score);
        /**@type {number} */
        this.maxcombo = parseInt(data.maxcombo);
        /**@type {number} */
        this.count50 = parseInt(data.count50);
        /**@type {number} */
        this.count100 = parseInt(data.count100);
        /**@type {number} */
        this.count300 = parseInt(data.count300);
        /**@type {number} */
        this.countmiss = parseInt(data.countmiss);
        /**@type {number} */
        this.countkatu = parseInt(data.countkatu);
        /**@type {number} */
        this.countgeki = parseInt(data.countgeki);
        /**@type {string} */
        this.rank = data.rank;
    }

    calACC() {
        if (this.mode === 1) {
            const total = this.count100 + this.count300 + this.countmiss;
            return total === 0 ? 0 : (((this.count300 + this.count100 * .5) * 300) / (total * 300) * 100);
        }
        if (this.mode === 2) {
            const total = this.count50 + this.count100 + this.count300 + this.countkatu + this.countmiss;
            return total === 0 ? 0 : ((this.count50 + this.count100 + this.count300) / total * 100);
        }
        if (this.mode === 3) {
            const total = this.count50 + this.count100 + this.count300 + this.countkatu + this.countgeki + this.countmiss;
            return total === 0 ? 0 : ((this.count50 * 50 + this.count100 * 100 + this.countkatu * 200 + (this.count300 + this.countgeki) * 300) / (total * 300) * 100);
        }
        if (this.mode == 0) {
            const total = this.count50 + this.count100 + this.count300 + this.countmiss;
            return total === 0 ? 0 : ((this.count50 * 50 + this.count100 * 100 + this.count300 * 300) / (total * 300) * 100);
        }
    }

    toSimpleData() {
        return new ScoreSimple(this);
    }
}

class CupManager {
    constructor(settings) {
        this.apikey = settings.apikey;
        this.mode = settings.mode;
        this.playerlist = new PlayerList();
    }

    async addPlayer(user) {
        try {
            let userdata = await OsuApi.getUser(user, this.mode, this.apikey);
            let username = userdata[0].username;
            let userId = userdata[0].user_id;
            this.playerlist.addPlayer(username, userId);
            console.log(this.playerlist.toString());
        }
        catch (ex) {
            console.log("获取选手 " + user + " 出错，" + ex);
        }
    }

    delPlayer(user) {
        this.playerlist.delPlayer(user);
        console.log(this.playerlist.toString());
    }

    async getRecentScores() {
        let users = this.playerlist.list;
        /**@type {Array<ScoreSimple>} */
        let resultDatas = [];
        for (let i = 0; i < users.length; i++) {
            const result = await OsuApi.getUserRecent(users[i].userId, this.mode, this.apikey);
            let scoreSimple = new Score(result[0], users[i], this.mode).toSimpleData();
            resultDatas.push(scoreSimple);
        }
        return resultDatas;
    }

    /**
     * @param {"acc"|"combo"|"score"} method
     */
    async showResult(method) {
        try {
            let resultDatas = await this.getRecentScores();
            if (resultDatas.length <= 0) return console.log("无数据");
            let scoreOutputer = new ScoreOutputer(resultDatas, method);
            console.log(scoreOutputer.output())
        }
        catch (ex) {
            console.log(ex);
        }
    }

}

module.exports = CupManager;
