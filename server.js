'use strict';

const Koa = require('koa');
const wechat = require('./server/g');
const config = require('./config');
const weixin = require('./wx/reply');
const crypto = require('crypto');
const Wechat = require('./server/wechat');
const urlString='https://tfiymrzokj.localtunnel.me';
var app = new Koa();
let ejs = require('ejs');
let heredoc = require('heredoc');
wechat(config.wechat,weixin.reply());
let tpl = heredoc(function () {/*
 <!DOCTYPE html>
 <html lang="en">
 <head>
 <meta charset="UTF-8">
 <meta name="viewport"
 content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
 <title>search movie</title>
 </head>
 <body>
 <h1>点我说话</h1>
 <p id="title"></p>
 <div id="year"></div>
 <div id="director"></div>
 <div id="poster"></div>
 </body>
 <script src="https://cdn.bootcss.com/zepto/1.1.7/zepto.js"></script>
 <script src="https://res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>
 <script>
 wx.config({
 debug: false,
 appId: 'wxc4049f3c44ec5a96',
 timestamp: '<%=timestamp%>',
 nonceStr: '<%=noncestr%>',
 signature: '<%=signature%>',
 jsApiList: [
 'startRecord',
 'stopRecord',
 'onVoiceRecordEnd',
 'translateVoice'
 ]
 });
 wx.ready(function () {
 let isR = false;
 $('h1').on('click', function () {
 if (!isR) {
 isR = true;
 wx.startRecord({
 cancel: function () {
 window.alert('qusiba');
 }
 })
 return;
 }
 isR = false;
 wx.stopRecord({
 success: function (res) {
 let localId = res.localId;
 wx.translateVoice({
 localId: localId,
 isShowProgressTips: 1,
 success: function (res) {
 let result = res.translateResult;
 $.ajax({
 type: 'get',
 url: `https://api.douban.com/v2/movie/search?q=${result}`,
 dataType: 'jsonp',
 jsonp: 'callback',
 success: function (data) {
 console.log(data)
 let subject = data.subjects[0];
 $('#title').html(subject.title);
 $('#year').html(subject.year);
 $('#director').html(subject.directors[0].name);
 $('#poster').html('<img src="' + subject.images.large + '"/>')
 }
 })


 }
 })
 }
 })
 })
 });

 </script>
 </html>
 */
});


let createNonce = function () {
    return Math.random().toString(36).substr(2, 15)
};
let createTimestamp = function () {
    return parseInt(new Date().getTime() / 1000, 10) + ''
}
function _sign(noncestr, timestamp, ticket, url) {
    let params = [
        'noncestr=' + noncestr,
        'jsapi_ticket=' + ticket,
        'timestamp=' + timestamp,
        'url=' + url
    ];
    let str = params.sort().join('&');
    let shasum = crypto.createHash('sha1');
    shasum.update(str);
    return shasum.digest('hex');
}
function sign(ticket, url) {
    let noncestr = createNonce();
    let timestamp = createTimestamp();
    let signature = _sign(noncestr, timestamp, ticket, url);
    console.log(666,ticket)
    console.log(777)
    return {
        noncestr,
        timestamp,
        signature
    }
}





app.use(function*(next) {
    if (this.url.indexOf('/movie' > -1)) {
        let wechatApi = new Wechat(config.wechat);
        let data = yield wechatApi.fetchAccessToken();
        let access_token = data.access_token;
        let ticketData = yield wechatApi.fetchTicket(access_token);
        let ticket = ticketData.ticket;
        let url = urlString+this.url;
        console.log(1111,url)
        let params = sign(ticket, url);
        this.body = ejs.render(tpl, params);
        return next;
    }
    yield next;
})



app.use(wechat(config.wechat, weixin.reply));

app.listen(8080);
console.log('listenIng:8080');
