const ApiRequest = require("./lib/apiRequest")
const WshubClient = require("./lib/client")

const RemoteDebug = function (auth, func, Region = 'ap-guangzhou') {
    this.auth = auth
    this.func = func
    this.Region = Region
    this.request = new ApiRequest(auth, func, Region)
    this.isFirst = true
}

RemoteDebug.prototype.remoteDebug = async function () {
    try {
        if (this.isFirst) {
            // 初试进来不管什么情况，调用一下停止，忽略报错
            await this.request.stopDebugging()
            await this.request.getFunction()
        }
        this.isFirst = false
    } catch (e) {
        // do nothing
    }
    try {
        await this.request.startDebugging()
        const { Url, Token } = await this.request.getDebuggingInfo()
        if (!Url || !Token) {
            throw Error('Get debugging info error: the remote Url or Token does not exist.');
        }
        this.client = new WshubClient({ Url, Token })
        try {
            await this.client.forwardDebug()
            console.log('Debugging listening on ws://127.0.0.1:9222.')
            console.log('For help see https://nodejs.org/en/docs/inspector.')
            console.log('Please open chorme, and visit chrome://inspect, click [Open dedicated DevTools for Node] to debug your code.')
        } catch (e) {
            console.error('Debug init error. Please confirm if the local port 9222 is used');
        }
        console.log('--------------------- The realtime log ---------------------')
        await this.client.forwardLog()
    } catch (e) {
        console.error(e.message)
    }
}

const delay = function (time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}

RemoteDebug.prototype.stop = async function () {
    try {
        if (this.client) {
            this.client.close()
        }
        await this.request.stopDebugging()
        await delay(1000)
        await this.request.getFunction()
    } catch (e) {
        console.error(e.message)
    }
}

module.exports = RemoteDebug