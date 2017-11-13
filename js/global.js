var linkerId = {
	scrollNews: 100,
	headNews: 101,
	instantNews: 102,
	putuoNews: 103,
	videoNews: 104,
	services: 107,   //服务
	interact: 114,   //互动
	rebellion: 115,  //报料
	photography:116, //摄影
	food: 117        //美食
};

var pullToRefresh = function() {
	var ws = plus.webview.currentWebview();
	// 下拉刷新事件
	ws.setPullToRefresh({
		support: true,
		style: 'circle',
		color: '#009cff',
		offset: '45px'
	}, function() {
		window.location.reload();
		ws.endPullToRefresh();
	});
}

var openWindow = function(u, i, s) {
	mui.openWindow({
		url: u,
		id: i,
		show: {
			aniShow: 'pop-in'
		},
	})
}

var share = function(ext) {
	console.log(ext)
	plus.share.getServices(function(shares) {
		shares.forEach(function(s) {
			if(s.id == 'weixin' && s.authenticated) {
				s.send(	{
					thumbs: '../img/ad.jpg',
					pictures: '../img/ad.jpg',
					title: '掌上普陀',
					content:'我正在使用掌上普陀你也一起来加入吧',
					href: 'http://ptnews.zjol.com.cn/',
					extra: {
						scene: ext
					}
				}, function() {
					mui.toast("分享到\"" + s.description + "\"成功！ ");
				}, function(e) {
					mui.toast("分享到\"" + s.description + "\"失败: " + e.code);
				});
			}
		})
	}, function(e) {
	    mui.toast("获取分享服务列表失败：" + e.message);
	});
}