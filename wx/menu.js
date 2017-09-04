'use strict';
module.exports = {
    "button": [
        {
            "type": "click",
            "name": "今日歌曲",
            "key": "click"
        },
        {
            "name": "菜单",
            "sub_button": [
                {
                    "type": "view",
                    "name": "搜索",
                    "url": "http://www.baidu.com/"
                },
                {
                    "type": "scancode_push",
                    "name": "扫码推送事件",
                    "key": "scancode_push"
                },
                {
                    "type": "scancode_waitmsg",
                    "name": "扫码带提示",
                    "key": "scancode_waitmsg",
                },
                {
                    "type": "pic_sysphoto",
                    "name": "系统拍照发图",
                    "key": "pic_sysphoto"
                },
                {
                    "type": "pic_photo_or_album",
                    "name": "拍照或者相册发图",
                    "key": "pic_photo_or_album"
                }
            ]
        },
        {
            "name": "菜单2",
            "sub_button": [
                {
                    "type": "pic_weixin",
                    "name": "微信相册发图",
                    "key": "pic_weixin"
                },
                {
                    "name": "发送位置",
                    "type": "location_select",
                    "key": "location_select"
                }
                /*{
                    "type": "media_id",
                    "name": "图片",
                    "media_id": "MEDIA_ID1"
                },
                {
                    "type": "view_limited",
                    "name": "图文消息",
                    "media_id": "MEDIA_ID2"
                }*/
            ]

        }
    ]
}


