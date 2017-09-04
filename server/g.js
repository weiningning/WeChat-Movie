'use strict';
const sha1 = require('sha1');
const Promise = require('bluebird');
const getRawBody = require('raw-body');
const Wechat = require('./wechat');
const request = Promise.promisify(require('request'));
const util = require('./utils');


let prefix = 'https://api.weixin.qq.com/cgi-bin/';
let api = {
    accessToken: `${prefix}token?grant_type=client_credential`
}


module.exports = function (opts,handler) {

    let wechat = new Wechat(opts);
    return function *(next) {
        console.log(this.method);

        var token = opts.token;
        var signature = this.query.signature;
        var nonce = this.query.nonce;
        var timestamp = this.query.timestamp;
        var echostr = this.query.echostr;
        var str = [token, timestamp, nonce].sort().join(''); //按字典排序，拼接字符串
        var sha = sha1(str); //加密
        console.log(this.method);
        let that = this;
        if (this.method === 'GET') {
            this.body = (sha === signature) ? echostr + '' : 'failed';  //比较并返回结果
        } else if (this.method === 'POST') {
            if (sha !== signature) {
                this.body = 'wrong';
                return false
            }
            let data = yield getRawBody(this.req, {
                length: this.length,
                limit: '1mb',
                encoding: this.charset
            });
            let content = yield util.parseXMLAsync(data);

            let message = util.formatXMLAsync(content.xml);
            this.weixin = message;
            /*停下来，执行handler函数，在handler里处理message.Event的类型*/
            yield handler.call(that,next);
            wechat.reply.call(that)

            /*if (message.MsgType === 'event') {
                //subscribe:订阅事件
                if (message.Event === 'subscribe') {
                    let now = new Date().getTime();
                    that.status = 200;
                    that.type = 'application/xml';
                    that.body =
                    return
                }
            }*/
        }
    }
}

