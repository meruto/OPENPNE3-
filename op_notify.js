$(document).ready(function(){

    // push/search.json 取得URL
    var search_url = openpne.apiBase + 'push/search.json?apiKey=' + openpne.apiKey;

    // 通知件数を返す push/count.json のテンプレート
    var count_json = {"status":"success","data":{"link":0,"message":0,"other":0}};

    // 通知内容を返す push/search.json のテンプレート
    var search_json = {"status":"success","data":[]};


    // push/search.json を取得
    $.getJSON(search_url).then(success);

    // 既読管理フラグ
    var is_read_flag = false;

    // 通知センターアイコンにクリックイベントをバインド
    $('.ncbutton').click(function(){
        if ('none' == $('#notificationCenterDetail').css('display')) {
            $('#notificationCenterDetail').show();
            if(is_read_flag == false){
                getBlogEntryDetail();
                is_read_flag = true;
            }
        } else {
            $('#notificationCenterDetail').hide();
        }
    });


    // JSON加工処理＆未読件数カウント用JSON生成
    function success(json) {

        // ステータスをテンプレートに転記
        search_json.status = json.status;
        count_json.status  = json.status;

        // 日記の通知エントリを再構成して互換性のある search.json を生成 - - - -

        // 日記の通知エントリを構造化する一時変数
        var blogs = {};

        // 日記とそれ以外の通知を分離
        $.each(json.data, function (index, item) {
            if(item.category == 'other' && item.url.match(/^\/diary/)) {
                if(!blogs[item.url]) {blogs[item.url] = []}
                blogs[item.url].push(item);
            } else {
                search_json.data.push(item)
            }
        });

        // 日記通知を一つの日記毎にまとめる
        $.each(blogs, function (url, items) {
            var first_item = items[0];
            first_item.comments = items;
            search_json.data.push(first_item);
        });


        // 未読件数の通知エントリー count.json を生成 - - - - - - - - - - - -
        $.each(search_json.data, function (index, item) {
            if(item.unread) {count_json['data'][item.category] += 1}
        });

        // 未読件数を表示
        showNotifyCount(count_json);

//        console.log(search_json, count_json);

    }


    // 未読件数を通知センターのアイコン横に表示する。（処理内容はオリジナルのまま未修正）
    function showNotifyCount(json){
        if(json.status=='success') {
          var $pushHtml = $("#notificationCenterCountTemplate").tmpl(json.data);
          $("#notificationCenter").append($pushHtml);
        }
    }

    // 日記の詳細を取得して、より情報の多い通知コメントにする。
    function getBlogEntryDetail() {

        var diary_ajax = [];
        var diary_search_json_url = openpne.apiBase + 'diary/search.json?apiKey=' + openpne.apiKey + '&id=';

        $.each(search_json.data, function (index, item) {
            if(item.category == 'other' && item.url.match(/^\/diary/)) {

                var diary_id = item.url.match(/\d+$/);

                var dfd = $.getJSON(diary_search_json_url + diary_id)
                          .then(function (diary) {
                                    item.body = '日記「' + diary.data.title + '」（' + diary.data.member.name + 'さん）に' +
                                    item.comments.length +'件の新着コメントがあります。'
                          });

                diary_ajax.push(dfd);
            }
        });

        // すべてのAjax通信・コメント編集が完了したら表示させる。
        $.when.apply(null, diary_ajax).then(showNotify);

    }


    // 通知センターの詳細情報DOMを生成して表示する。（処理内容はオリジナルのまま未修正）
    function showNotify() {

        if(search_json.status=='success') {
            if(search_json.data[0]) {
                var $pushHtml = $('#notificationCenterListTemplate').tmpl(search_json.data);
                $('.friend-accept', $pushHtml).friendLink();
                $('.friend-reject', $pushHtml).friendUnlink()
                $('#notificationCenterLoading').hide();
                $('#notificationCenterError').hide();
                $('#notificationCenterDetail').append($pushHtml);
            } else {
                $('#notificationCenterLoading').hide();
                $('#notificationCenterError').show();
            }
        } else {
            showError();
        }

        $('.nclink').pushLink();

    }

    // エラー情報を表示する。（処理内容はオリジナルのまま未修正）
    function showError() {
        $('#notificationCenterLoading').hide();
        $('#notificationCenterError').show();
    }

});
