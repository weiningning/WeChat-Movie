const path = require('path');
const util = require('./libs/util');
const wechat_file = path.join(__dirname, './config/wechat.txt');
const wechat_ticket_file = path.join(__dirname, './config/wechat_ticket_file.txt');
const config = {
    wechat: {
        appID: 'wxc4049f3c44ec5a96', //填写你自己的appID
        //appID: 'wxdafdbd8a413a34df', //公众号
        appSecret: 'c923b473163937ee160f2c955f03f194',  //填写你自己的appSecret
        //appSecret: 'cd8d4803020cc55e8c64067477fe11c1',  //公众号

        token: 'wnn1415islearningdemo',  //填写你自己的token
        getAccessToken: function () {
            return util.readFileAsync(wechat_file)
        },
        saveAccessToken: function (data) {
            data=JSON.stringify(data);
            return util.writeFileAsync(wechat_file,data)
        },
        getTicket: function () {
            return util.readFileAsync(wechat_ticket_file)
        },
        saveTicket: function (data) {
            data=JSON.stringify(data);
            return util.writeFileAsync(wechat_ticket_file,data)
        }
    }
};
module.exports=config