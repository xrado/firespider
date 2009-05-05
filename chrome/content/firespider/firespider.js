FBL.ns(function() { with (FBL) {

var panelName = "FireSpider";
var seen = [], togo = [], location = [], links = [];
var qrunning = 0, requests = 0, finished = 0, request_timer = null, currentonly = false;

Firebug.FireSpiderModel = extend(Firebug.Module,{

	showPanel: function(browser, panel) {
		var isHwPanel = panel && panel.name == panelName;
		var hwButtons = browser.chrome.$("fbFireSpiderButtons");
		this.start_page = browser.chrome.$("button_Start_page");
		this.start_site = browser.chrome.$("button_Start_site");
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
	
	onStart_page: function(context) {
		currentonly = true;
		if(context.window.location.href){
			this.stop.disabled = false;
			this.start_page.disabled = true;
			this.start_site.disabled = true;
			this.logSpiderHeader();
			seen = [], togo = [], location = [], links = [];
			requests = 0, finished = 0, qrunning = 0;
			this.cancel = false;
			this.queue(context.window.location.href);
		}
	},

	onStart_site: function(context) {
		currentonly = false;
		if(context.window.location.href){
			this.stop.disabled = false;
			this.start_page.disabled = true;
			this.start_site.disabled = true;
			this.logSpiderHeader();
			seen = [], togo = [], location = [], links = [];
			requests = 0, finished = 0, qrunning = 0;
			this.cancel = false;
			this.queue(context.window.location.href);
		}
	},

	onStop: function(context) {
		this.stop.disabled = true;
		this.start_page.disabled = false;
		this.start_site.disabled = false;
		this.cancel = true;
		if ( this.request.readyState > 0 || this.request.readyState < 4 ) this.request.abort();
		clearTimeout(this.timeoutId);
		this.logSpiderRequest({ctype:'...',url:'stop'});
	},

	onClear: function(context) {
		context.getPanel(panelName).panelNode.innerHTML='';
	},

	reader:function(url){
		var self = this;
		requests++;
		this.logSpiderRequest({ctype:'...','url':url});
		seen.push(url);
		this.request = new XMLHttpRequest();
		this.timeoutId = setTimeout( function() { // time out
			if ( self.request.readyState > 0 || self.request.readyState < 4 ) {
				self.request.abort();
				finished++;
				self.logSpiderRequest({
					ctype: self.request.status,
					'url': url,
					error: 'time out' ,
					timer: '',
					title: '',
					where: location[url],
					link: links[url]
				});
			}
		}, 10000 );
		self.request.onreadystatechange = function() {
			var type = self.request.getResponseHeader("Content-Type");
			if(type!=null && !type.match('text')) { // not text
				clearTimeout(self.timeoutId);
				self.logSpiderRequest({
					ctype: type,
					'url': url,
					error: 'not text/html' ,
					timer: '',
					title: '',
					where: location[url],
					link: links[url] 
				});
				finished++;
				this.onreadystatechange=null;
			}
			if (self.request.readyState == 4 && self.request.status == 200) { // found
				clearTimeout(self.timeoutId);
				self.parser(url,self.request.responseText,type);
			}

			if (self.request.readyState > 1 && self.request.status == 404) { // not found
				clearTimeout(self.timeoutId);
				self.logSpiderRequest({ 
					ctype: self.request.status,
					'url': url,
					error: 'not found' ,
					timer: '',
					title: '',
					where: location[url],
					link: links[url] 
				});
				finished++;
				this.onreadystatechange=null;
			}
		}
		this.request.open("GET", url, true);
		if (Firebug.getPref(Firebug.prefDomain,'firespider.refererheader')) this.request.setRequestHeader("Referer",location[url]);
		request_timer = new Date();
		this.request.send(null);
	},
	
	parser: function(url,html,type){
		html = html.replace(/<!(?:--[\s\S]*?--\s*)?>\s*/g,''); // replace comments
		request_timer = ((new Date()).getTime() - request_timer.getTime())/1000;
		var title = /<title>([^<]*)<\/title>/i.exec(html);
		title = title ? title : ' ';
		var base = /<base href="(.*?)"/i.exec(html);
		base = base ? base[1] : '';
		var regex = /<a[^>]+href\s*=\s*("|\')([^"|\']+)[^>]*>(.*?)<\/a>/ig;
		var suburl;
		if(currentonly && finished>=1){
			this.logSpiderRequest({
				ctype: type,
				'url': url,
				error: '' ,
				timer: request_timer.toFixed(2)+'s',
				title: html_entity_decode(title[1]),
				where: location[url],
				link: links[url] 
			});
			finished++;
			return;
		}
		while ((suburl = regex.exec(html)) != null) {
			var tmpurl = this.makeurl(url,base,suburl[2]);
			if(tmpurl && seen.indexOf(tmpurl)==-1 && togo.indexOf(tmpurl)==-1) {
				togo.push(tmpurl);
				location[tmpurl] = url;
				var ll = suburl[3].replace(/(<([^>]+)>)/ig,"");
				links[tmpurl] = html_entity_decode(ll ? ll : suburl[3]);
			}
		}
		this.logSpiderRequest({
			ctype: type,
			'url': url,
			error: '' ,
			timer: request_timer.toFixed(2)+'s',
			title: html_entity_decode(title[1]),
			where: location[url],
			link: links[url] 
		});		
		finished++;
	},

	makeurl: function(url,base,suburl){
		suburl = html_entity_decode(suburl);
		if(suburl.match(/mailto\:|javascript\:/i)) return;
		if(suburl.match('#')) suburl=suburl.split('#')[0];
		if(!suburl) return;
		var url_ = parseUri(url);
		var suburl_ = parseUri(suburl);
		var domain = url_.protocol+'://'+url_.host+(url_.port ? (':'+url_.port) : '');
		if(suburl.match('\:\/\/')){
			if(suburl_.host==url_.host) return suburl;
			else return;
		}
		if(suburl[0]=='/') return domain+suburl;
		if(suburl[0]=='?') {
			if(url.match(/\?/)) url = url.split('?')[0];
			return url+suburl;
		}
		if(suburl.match(/^\.\//)) suburl = suburl.replace(/^\.\//,'');
		if(suburl.match(/^\.\./)) {
			url = trim(url.substr(0,strrpos(url,'/')+1),'/');
			var c = substr_count(suburl, '..');
			for(var i=0;i<c;i++) url = url.substr(0,strrpos(url,'/'));
			suburl = trim(suburl,'./');
			return url+(suburl ? '/'+suburl : '');
		}
		if(suburl[0]!='/' && base) return base+suburl;
		if((url.substr(-1)!='/' && suburl[0]!='/')) return url.substr(0,strrpos(url,'/')+1)+suburl;
		return trim(url,'/')+'/'+suburl;
	},

	queue: function(start){
		if(this.cancel) return;
		if(start && !qrunning && !seen.length && !togo.length) this.reader(start);
		if(!start && requests==finished) {
			if(finished && !togo.length) {
				this.stop.disabled = true;
				this.start_page.disabled = false;
				this.start_site.disabled = false;
				this.logSpiderRequest({ctype:'...',url:seen.length+' links found'});
				return;
			}
			this.reader(togo.shift());
		}
		var self = this;
		var timer = setTimeout(function(){ self.queue(); },200);
		qrunning = true;
	},

	logSpiderHeader: function(){
		var panel = FirebugContext.getPanel('FireSpider');
		if(!getElementByClass(panel.panelNode, "spidertable")) output.table.append({}, panel.panelNode, null);
		var tbody = getElementByClass(panel.panelNode, "spidertable");
		output.header.insertRows({}, tbody.lastChild ? tbody.lastChild : tbody);
		scrollToBottom(panel.panelNode);
	},
	
	logSpiderRequest: function(data){
		var panel = FirebugContext.getPanel('FireSpider');
		var tbody = getElementByClass(panel.panelNode, "spidertable");
		if(data.ctype=='...'){
			output.loading.insertRows({'url':data.url}, tbody.lastChild ? tbody.lastChild : tbody);
		} else {
			var len = tbody.childNodes.length-1;
			tbody.removeChild(tbody.childNodes[len]);
			var bg_color = len%2 ? 'row':'';
			output.row.insertRows({
				bgcolor:bg_color,
				error:data.error,
				ctype:data.ctype,
				url:data.url,
				title:data.title,
				where: data.where,
				link: data.link,
				timer: data.timer
			}, tbody.lastChild ? tbody.lastChild : tbody);
		}
		scrollToBottom(panel.panelNode);
	}
});

var output = domplate({
	table: TABLE({width:'100%'},TBODY({class:'spidertable'})),
	header: TR({class:"header"},
		TH({width:'50'},"content"),
		TH({align:'left'},"url"),
		TH({align:'left'},"title"),
		TH({align:'left'},"referer"),
		TH({align:'right',width:'40'},"time")
	),
	loading: TR(
		TD({'align':'center'},"..."),
		TD({'align':'left'},"$url|shorten")
	),
	row: TR({class:"$bgcolor"},
		TD({class:"$ctype|ctypecolor"},"$ctype|contenttype"),
		TD({align:'left',onclick:"$onOpenUrl",class:'link',title:"$url"},"$url|shorten"),
		TD({align:'left',class:"$error|errorcolor"},"$title"),
		TD({align:'left',title:"$where",onclick:"$onOpenUrl|defined",class:'link'},"$link|defined"),
		TD({align:'right',class:'gray'},"$timer")
	),
	contenttype:function(ctype){
		return (typeof ctype =='string') ? ctype.split(/[; ]/)[0] : ctype;
	},
	defined: function(){
		//alert(typeof arguments[0])
		return arguments[0] ? arguments[0] : '';
	},
	errorcolor: function(error) {
		return (error) ? 'red' : '';
	},
	ctypecolor: function(ctype) {
		return ctype.toString().match(/[a-z]/) ? 'green' : 'red';
	},
	shorten: function(){
		var url_ = parseUri(arguments[0]);
		var domain = url_.protocol+'://'+url_.host+(url_.port ? (':'+url_.port) : '');
		var out = arguments[0].replace(domain,'');
		return out ? out : '/';
	},
	onOpenUrl: function(event) { 
		openNewTab(event.target.title); 
	}
});

Firebug.bindFixed = function(){
	var args = cloneArray(arguments), fn = args.shift(), object = args.shift();
	return function() { return fn.apply(object, args); }
};

function FireSpiderPanel() {}
FireSpiderPanel.prototype = extend(Firebug.Panel,{
	name: panelName,
	title: "FireSpider",
	initialize: function() {
		Firebug.Panel.initialize.apply(this, arguments);
		Firebug.FireSpiderModel.addStyleSheet(this.document);
	},
	getOptionsMenuItems: function(context){
		return [
			this.optionMenu("Referer header", "firespider.refererheader"),
			"-"
		];
	},
	optionMenu: function(label, option){
		var value = Firebug.getPref(Firebug.prefDomain, option);
		return {
			label: label,
			nol10n: true,
			type: "checkbox",
			checked: value,
			command: bindFixed(Firebug.setPref, this, Firebug.prefDomain, option, !value)
		};
	}
});

Firebug.registerModule(Firebug.FireSpiderModel);
Firebug.registerPanel(FireSpiderPanel);

}});


