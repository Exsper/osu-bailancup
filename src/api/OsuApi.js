const querystring = require('querystring');
const fetch = require('node-fetch');

class OsuApi {
    static async getData(url, times = 0) {
        const MAX_RETRY = 3;
        const TIMEOUT = 5000;
        try {
            const data = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/octet-stream" },
                credentials: "include",
                timeout: TIMEOUT,
            }).then((res) => res.json());
            return data;
        }
        catch (ex) {
            if (times >= MAX_RETRY) {
                throw "获取数据超过最大重试次数，停止获取";
            }
            console.log("获取数据失败，第" + (times + 1) + "次重试");
            return this.getData(url, times + 1);
        }
    }


    static async apiCall(_path, _data) {
        const contents = querystring.stringify(_data);
        const url = "https://osu.ppy.sh/api" + _path + '?' + contents;
        // console.log(url);
        const data = await this.getData(url);
        if (!data) throw "获取数据失败";
        const dataString = JSON.stringify(data);
        if (dataString === "[]" || dataString === "{}") throw "无有效数据";
        return data;
    }

    static async getUser(user, mode, apiKey) {
        let option = {};
        if ((user.length > 4) && (user.substring(0, 1) === '"') && (user.substring(user.length - 1) === '"')) {
            // 带引号强制字符串形式
            option.u = user.substring(1, user.length - 1);
            option.type = 'string';
        }
        else option.u = user;
        option.m = mode;
        option.k = apiKey;
        const resp = await this.apiCall('/get_user', option);
        return resp;
    }

    static async getUserRecent(userId, mode, apiKey) {
        let option = {};
        option.u = userId;
        option.type = 'id';
        option.m = mode;
        option.limit = 1;
        option.k = apiKey;
        const resp = await this.apiCall('/get_user_recent', option);
        return resp;
    }
}

module.exports = OsuApi;
