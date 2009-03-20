FBL.ns(function() { with (FBL) {

var panelName = "FireSpider";
var seen = [], togo = [], location = [], links = [];
var qrunning = 0, requests = 0, finished = 0, request_timer = null;

Firebug.FireSpiderModel = extend(Firebug.Module,{

	showPanel: function(browser, panel) {
		var isHwPanel = panel && panel.name == panelName;
		var hwButtons = browser.chrome.$("fbFireSpiderButtons");
		this.start = browser.chrome.$("button_Start");
		this.stop = browser.chrome.$("button_Stop");
		this.stop.disabled = true
		collapse(hwButtons, !isHwPanel);
	},

	addStyleSheet: function(doc){
		if ($("hwStyles", doc)) return;
		var styleSheet = createStyleSheet(doc, "chrome://firespider/content/style.css");
		styleSheet.setAttribute("id", "hwStyles");
		addStyleSheet(doc, styleSheet);
	},

	onStart: function(context) {
		if(context.window.location.href){
			this.stop.disabled = false;
			this.start.disabled = true;
			this.logSpiderRequest('start');
			seen = [], togo = [], location = [], links = [];
			requests = 0, finished = 0, qrunning = 0;
			this.cancel = false;
			this.queue(context.window.location.href);
		}
	},

	onStop: function(context) {
		this.stop.disabled = true;
		this.start.disabled = false;
		this.cancel = true;
		if ( this.request.readyState > 0 || this.request.readyState < 4 ) this.request.abort();
		clearTimeout(this.timeoutId);
		this.logSpiderRequest('stop');
	},

	onClear: function(context) {
		context.getPanel(panelName).panelNode.innerHTML='';
	},

	reader:function(url){
		var self = this;
		requests++;
		this.logSpiderRequest(url + ' ...');
		seen.push(url);
		this.request = new XMLHttpRequest();
		this.timeoutId = setTimeout( function() { // time out
			if ( self.request.readyState > 0 || self.request.readyState < 4 ) {
				self.request.abort();
				finished++;
				self.logSpiderData({ 'url':url, 'error': 'time out' ,'timer':'', 'title':'', 'where':location[url], 'link':links[url] });
			}
		}, 10000 );
		self.request.onreadystatechange = function() {
			var type = self.request.getResponseHeader("Content-Type");
			if(type!=null && !type.match('text')) { // not text
				clearTimeout(self.timeoutId);
				self.logSpiderData({ 'url':url, 'error': 'not text/html' ,'timer':'', 'title':'', 'where':location[url], 'link':links[url] });
				finished++;
				this.onreadystatechange=null;
			}
			if (self.request.readyState == 4 && self.request.status == 200) { // found
				clearTimeout(self.timeoutId);
				self.parser(url,self.request.responseText);
			}

			if (self.request.readyState > 1 && self.request.status == 404) { // not found
				clearTimeout(self.timeoutId);
				self.logSpiderData({ 'url':url, 'error': 'not found' ,'timer':'', 'title':'', 'where':location[url], 'link':links[url] });
				finished++;
				this.onreadystatechange=null;
			}
		}
		this.request.open("GET", url, true);
		request_timer = new Date();
		this.request.send(null);
	},
	
	parser: function(url,html){
		request_timer = ((new Date()).getTime() - request_timer.getTime())/1000;
		var title = /<title>([^<]*)<\/title>/.exec(html);
		title = (title && title!='undefined') ? title : ' ';
		var base = /<base href="(.*?)"/i.exec(html);
		var regex = /<a[^>]+href\s*=\s*("|\')([^"|\']+)[^>]*>(.*?)<\/a>/g;
		var suburl;
		while ((suburl = regex.exec(html)) != null) {
			var tmpurl = this.makeurl(url,suburl[2]);
			if(tmpurl && seen.indexOf(tmpurl)==-1 && togo.indexOf(tmpurl)==-1) {
				togo.push(tmpurl);
				location[tmpurl] = url;
				var ll = suburl[3].replace(/(<([^>]+)>)/ig,"");
				links[tmpurl] = html_entity_decode(ll ? ll : suburl[3]);
			}
		}
		this.logSpiderData({ 'url':url, 'error': '' ,'timer':request_timer.toFixed(2)+'s', 'title':html_entity_decode(title[1]), 'where':location[url], 'link':links[url] })
		finished++;
	},

	makeurl: function(url,suburl){
		suburl = html_entity_decode(suburl);
		if(suburl.match(/mailto\:|javascript\:/)) return;
		if(suburl.match('#')) suburl=suburl.split('#')[0];
		if(!suburl) return;
		var url_ = parseUri(url);
		var domain = url_.protocol+'://'+url_.host;
		if(suburl.match('\:\/\/')){
			if(suburl.match(domain)) return suburl;
			else return;
		}
		if(suburl[0]=='/') return domain+suburl;
		if(suburl[0]=='?') {
			if(url.match(/\?/)) url = url.split('?')[0];
			return url+suburl;
		}
		if(suburl.match(/^\.\//)) suburl = suburl.replace(/^\.\//,'');
		if(suburl.match(/\.\./)) {
			url = trim(url.substr(0,strrpos(url,'/')+1),'/');
			var c = substr_count(suburl, '..');
			for(var i=0;i<c;i++) url = url.substr(0,strrpos(url,'/'));
			suburl = trim(suburl,'./');
			return url+(suburl ? '/'+suburl : '');
		}
		if((url.substr(-1)!='/' && suburl[0]!='/')) return url.substr(0,strrpos(url,'/')+1)+suburl;
		return trim(url,'/')+'/'+suburl;
	},

	queue: function(start){
		if(this.cancel) return;
		if(start && !qrunning && !seen.length && !togo.length) this.reader(start);
		if(!start && requests==finished) {
			if(finished && !togo.length) {
				this.stop.disabled = true;
				this.start.disabled = false;
				this.logSpiderRequest('finish (parsed '+seen.length+' links)');
				return;
			}
			this.reader(togo.shift());
		}
		var self = this;
		var timer = setTimeout(function(){ self.queue(); },200);
		qrunning = true;
	},

	logSpiderRequest: function(url){
		var panel = FirebugContext.getPanel('FireSpider');
		output.request.append({'url':url}, panel.panelNode, null);
		scrollToBottom(panel.panelNode);
	},

	logSpiderData: function(data){
		data.ttitle = data.error ?  '' : 'title: ';
		var panel = FirebugContext.getPanel('FireSpider');
		var len = panel.panelNode.childNodes.length-1;
		panel.panelNode.removeChild(panel.panelNode.childNodes[len]);
		output.requestData.append(data, panel.panelNode, null);
	}
});


var output = domplate({
	'request': DIV({class: "spiderRequest"},
		IMG({src: "chrome://firespider/content/open.png", align:'absmiddle'}),
		"$url"
	),
	'requestData': DIV({class: "spiderData"},
		SPAN({class:'spiderTimer'},"$timer"),
		IMG({src: "chrome://firespider/content/closed.png", align:'absmiddle',onclick: "$onOpenClose"}),
		SPAN({class:'spiderUrl',onclick: "$onOpenUrl"},"$url"),
		SPAN({class:'spiderError'},"$error"),
		SPAN({class:'spiderFrom'},"$ttitle "),
		SPAN({class:'spiderTitle'},"$title"),
		DIV({class: "spiderDataMore",style:'display:none'},
			SPAN({class:'spiderFrom'},"got from: "),
			SPAN({class:'spiderFromWhere',onclick: "$onOpenFrom"},"$where"),
			SPAN({class:'spiderLink'}," link name:"),
			SPAN({class:'spiderFromLink'},"$link")
		)
	),
	'onOpenUrl' : function(event) {
		openNewTab(event.target.innerHTML);
	},
	'onOpenFrom' : function(event) {
		openNewTab(event.target.innerHTML);
	},
	'onOpenClose' : function(event) {
		event.target.src = event.target.src.match('open') ? event.target.src.replace('open','closed') : event.target.src.replace('closed','open');
		var child = event.target.parentNode.getElementsByTagName('DIV')[0];
		child.style.display = child.style.display.match('none') ? '' : 'none';
	}
});


function FireSpiderPanel() {}
FireSpiderPanel.prototype = extend(Firebug.Panel,{
	name: panelName,
	title: "FireSpider",

	initialize: function() {
		Firebug.Panel.initialize.apply(this, arguments);
		Firebug.FireSpiderModel.addStyleSheet(this.document);
	},
});

Firebug.registerModule(Firebug.FireSpiderModel);
Firebug.registerPanel(FireSpiderPanel);

}});
