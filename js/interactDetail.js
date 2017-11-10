// 扩展API加载完毕，现在可以正常调用扩展API
function plusReady() {
	mui.init({
		beforeback: function() {
			interactDetail.interactId = 0;
			interactDetail.interactDetail = {imgs:[]};
			interactDetail.comments = [];
			interactDetail.placeholder = '说点什么...';
			interactDetail.comment = '';
			interactDetail.haveComment = false;
			interactDetail.bHaveMore_comment = false;
			interactDetail.zan = 0;
			interactDetail.like = false;
		}
	})
	
	// 相册显示时监听物理返回按键，若已经显示则优先关闭相册
	var oldback = mui.back;
	mui.back = function() {
	    if(interactGraphic.show) {
	    	interactGraphic.show = false;
	    	$('body').removeClass('no-scroll');
	    	return false;
	    }
	    oldback();
	}
	
	var userInfo = _load(_get('userInfo'));

	var interactDetail = new Vue({
		el: '#interactDetail',
		data: {
			interactId: 0,
			interactDetail:{
				imgs:[],
			},
			comments: [],
			placeholder: '说点什么...',
			comment: '',
			haveComment: false,
			bHaveMore_comment: false,
			zan: 0,   //点赞个数
			like: false    //自己点赞
		},
		methods: {
			openGallery: function(imgs, index) {
				console.log(imgs)
				interactGraphic.show = true;
				interactGraphic.imgs = imgs;
				$('body').addClass('no-scroll');
				setTimeout(function(){
					var swiper = new Swiper('.swiper-container');
					swiper.slideTo(index, 500, false);
				}, 800)
			},
			//获取互动详情
			getDetail:function(){
				var self = this;
				
				_callAjax({
					cmd: "fetch",
					sql: "select u.name, u.img as userImg, a.id, a.content, a.img, strftime('%Y-%m-%d %H:%M', a.logtime) as logtime from interact a left outer join User u on a.userId = u.id  where a.id=?",
					vals: _dump([self.interactId])
	
				}, function(d) {
					if(d.success && d.data) {
						var r = d.data[0];
						var arrImg = r.img.split(';');
						r.imgs = arrImg;
						self.interactDetail = r;
					}
				});
			},
			//获取评论
			getComments:function(){
				var self = this;
				
				_callAjax({
					cmd: "fetch",
					sql: "select u.name, u.img as userImg, c.id, c.content, strftime('%Y-%m-%d %H:%M', c.logtime) as logtime from interactComments c left outer join User u on c.userId = u.id where c.interactId = ? order by c.id desc limit 5",
					vals:_dump([self.interactId])
				}, function(d) {
					if(d.success && d.data) {
						self.comments = d.data;
						self.bHaveMore_comment = true;
		
					}else{
						self.bHaveMore_comment = false;
					}
				});
			},
			//获取更多评论
			getMoreComments:function(){
				var self = this;
				
				var f = 10e5;
				if(self.comments.length) {
					f = _at(self.comments, -1).id;
				}
				
				_callAjax({
					cmd: "fetch",
					sql: "select u.name, u.img as userImg, c.id, c.content, strftime('%Y-%m-%d %H:%M', c.logtime) as logtime from interactComments c left outer join User u on c.userId = u.id  where c.interactId = ? and c.id<? order by c.id desc limit 5",
					vals: _dump([self.interactId,f])
				}, function(d) {
					if(d.success && d.data) {
						self.bHaveMore_comment = true;
						d.data.forEach(function(r) {
							self.comments.push(r);
						});
					}else{
						self.bHaveMore_comment = false;
						mui.toast("没有更多评论了");
						return;
					}
				});
			},
			//发送
			diliver: function(){
				var self = this;
				
				if(!self.haveComment) return;
				if(userInfo.id == null) return mui.toast("请先在个人中心登录");
				if(''==self.comment.trim()) return mui.toast("请填写评论内容");
				
				_callAjax({
					cmd: "exec",
					sql: "insert into interactComments(content, replyTo, interactId, userId) values('"+ self.comment.trim() +"',(select userId from interact where id = "+ self.interactId +" ),"+ self.interactId +","+ userInfo.id +")"
	//				vals: _dump([self.comment.trim(),  self.interactId, userInfo.id])
				}, function(d) {
					if(d.success) {
						mui.toast("评论成功");
						self.getComments();
						//清空输入框
						self.comment = '';
					}
				});
			},
			//获取点赞个数
			getZan:function(){
				var self = this;
				
				_callAjax({
					cmd: "fetch",
					sql: "select count(*) as total from interact_praises where interactId = ?",
					vals:_dump([self.interactId])
				}, function(d) {
					if(d.success && d.data) {
						self.zan = d.data[0].total;
					}
				});
			},
			//点赞
			clickZan:function(){
				var self = this;
				
				if(userInfo.id == null) return mui.toast("请先在个人中心登录");
				if(!self.like){
					//点赞
					_callAjax({
						cmd: "exec",
						sql: "insert into interact_praises(interactId, userId) values(?,?)",
						vals: _dump([self.interactId, userInfo.id])
					}, function(d) {
						if(d.success) {
							self.getZan();
							self.like = true;
						}else {
							self.like = false;
						}
					});
				}else{
					//取消
					_callAjax({
						cmd: "exec",
						sql: "delete from interact_praises where interactId = ? and userId = ?",
						vals: _dump([self.interactId, userInfo.id])
					}, function(d) {
						if(d.success) {
					
							self.getZan();
							self.like = false;
						}else{
							self.like = true;
						}
					});
				}
				
			}
		},
		watch: {
			comment: function() {
				if(this.comment.length > 0) return this.haveComment = true;
				this.haveComment = false;
			}
		}
	})
	
	var interactGraphic = new Vue({
		el: '#interactGraphic',
		data: {
			show: false,
			imgs: [],
			index: 0
		},
		methods: {
			close: function() {
				this.show = false;
				$('body').removeClass('no-scroll');
			}
		},
	})
	
	//添加interactId自定义事件监听
	window.addEventListener('interactId', function(event) {
		//获得事件参数
		interactDetail.interactId = event.detail.id;
		//根据id向服务器请求文章评论
		userInfo = _load(_get('userInfo'));
		interactDetail.getDetail();
		//清空防止加载更多
		interactDetail.comments = [];
		interactDetail.getComments();
		interactDetail.getZan();
		
		//本人是否点赞
		if(userInfo.id != null) {
			_callAjax({
				cmd: "fetch",
				sql: "select * from interact_praises where interactId = " + event.detail.id + " and userId = " + userInfo.id
			}, function(d) {
				if(d.success && d.data) {
	
					interactDetail.like = true;
	
				}else{
					interactDetail.like = false;
				}
			});
		}
	})
}

// 判断扩展API是否准备，否则监听'plusready'事件
if(window.plus) {
	plusReady();
} else {
	document.addEventListener('plusready', plusReady, false);
}