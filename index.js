var LoadingIssuesList = new Array();
var DebugOn = false;
var $ = jQuery;

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/
;if("document" in self&&!("classList" in document.createElement("_"))){(function(j){"use strict";if(!("Element" in j)){return}var a="classList",f="prototype",m=j.Element[f],b=Object,k=String[f].trim||function(){return this.replace(/^\s+|\s+$/g,"")},c=Array[f].indexOf||function(q){var p=0,o=this.length;for(;p<o;p++){if(p in this&&this[p]===q){return p}}return -1},n=function(o,p){this.name=o;this.code=DOMException[o];this.message=p},g=function(p,o){if(o===""){throw new n("SYNTAX_ERR","An invalid or illegal string was specified")}if(/\s/.test(o)){throw new n("INVALID_CHARACTER_ERR","String contains an invalid character")}return c.call(p,o)},d=function(s){var r=k.call(s.getAttribute("class")||""),q=r?r.split(/\s+/):[],p=0,o=q.length;for(;p<o;p++){this.push(q[p])}this._updateClassName=function(){s.setAttribute("class",this.toString())}},e=d[f]=[],i=function(){return new d(this)};n[f]=Error[f];e.item=function(o){return this[o]||null};e.contains=function(o){o+="";return g(this,o)!==-1};e.add=function(){var s=arguments,r=0,p=s.length,q,o=false;do{q=s[r]+"";if(g(this,q)===-1){this.push(q);o=true}}while(++r<p);if(o){this._updateClassName()}};e.remove=function(){var t=arguments,s=0,p=t.length,r,o=false;do{r=t[s]+"";var q=g(this,r);if(q!==-1){this.splice(q,1);o=true}}while(++s<p);if(o){this._updateClassName()}};e.toggle=function(p,q){p+="";var o=this.contains(p),r=o?q!==true&&"remove":q!==false&&"add";if(r){this[r](p)}return !o};e.toString=function(){return this.join(" ")};if(b.defineProperty){var l={get:i,enumerable:true,configurable:true};try{b.defineProperty(m,a,l)}catch(h){if(h.number===-2146823252){l.enumerable=false;b.defineProperty(m,a,l)}}}else{if(b[f].__defineGetter__){m.__defineGetter__(a,i)}}}(self))};

// usage: log('inside coolFunc',this,arguments);
// http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
// added this logging function from paul irish to debug if needed.
window.log = function() {
	if(DebugOn == 1) {
		log.history = log.history || [];   // store logs to an array for reference
		log.history.push(arguments);
		if(this.console) {
			console.log(Array.prototype.slice.call(arguments));
			console.log(Mantis.CurrentProjectID);
		}
	}
	else {

	}
};

var urlParams;
(window.onpopstate = function() {
	var match,
			pl = /\+/g, // Regex for replacing addition symbol with a space
			search = /([^&=]+)=?([^&]*)/g,
			decode = function(s) {
				return decodeURIComponent(s.replace(pl, " "));
			},
			query = window.location.search.substring(1);

	urlParams = {};
	while(match = search.exec(query))
		urlParams[decode(match[1])] = decode(match[2]);
})();

var preConfiguredMantisURL = "";

window.addEventListener("load", window_load);
window.addEventListener("DOMContentLoaded", function() {

	preConfiguredMantisURL = DefaultSettings.connectURL;

	LoadSettingsFromLocalStorage();
	if(DefaultSettings.selectedStyle)
		Kanban.ApplyTheme(DefaultSettings.selectedStyle);

	// 2ms to apply the style before we turn the display on
	window.setTimeout(function() {
		document.getElementById("realcontentcontainer").style.visibility = 'visible';
		document.getElementById("realcontentcontainer").classList.add("load");
	}, 200);

});

function window_load() {
	document.getElementById('newAttachmentFile').addEventListener('change', HandleFileSelect, false);

	$(function() {
		$("[data-toggle='tooltip']").tooltip();
	});

	//make sure that the username and password form doesnt actually submit.
	//need this here as a fail safe because jQuery is included.
	$('#userLoginForm').submit(function() {
		Login();
		return false;
	});

	$("#project-selector").hide();
	document.getElementById("username").focus();
	jQuery(document).ready(function($) {
		$('#tabs').tab();
	});

	AutoLogin();

	/*
	 $(document).bind('keyup', 'shift+ctrl+g', function() {
	 document.getElementById("searchfield").focus();
	 });
	 */
}

function HandleFileSelect(evt) {
	var files = evt.target.files; // FileList object

	// Loop through the FileList and render image files as thumbnails.
	for(var i = 0, f; f = files[i]; i++) {
		var reader = new FileReader();

		// Closure to capture the file information.
		reader.onload = (function(theFile) {
			return function(e) {
				// Render thumbnail.
				var newAttachmentDiv = document.createElement('div');
				newAttachmentDiv.setAttribute("class", "newfileattach");
				var data = e.target.result.substring(e.target.result.indexOf(",") + 1);
				newAttachmentDiv.setAttribute("filedata", data);
				//newAttachmentDiv.setAttribute("filedataulr",e.target.result);
				newAttachmentDiv.setAttribute("filename", theFile.name);
				var mimeType = "";
				if(theFile.type == undefined || theFile.type == "") {
					mimeType = "application/octet-stream";
				} else {
					mimeType = theFile.type;

				}
				newAttachmentDiv.setAttribute("filetype", mimeType);
				newAttachmentDiv.innerHTML = theFile.name + " (" + mimeType + ") " + Math.round(data.length / 1024, 2) + "Kb";
				document.getElementById('newAttachmentList').appendChild(newAttachmentDiv);
				document.getElementById('newAttachmentFile').value = "";
			};
		})(f);

		// Read in the image file as a data URL.
		reader.readAsDataURL(f);
	}
}

function ShallowCopy(o) {
	var copy = Object.create(o);
	for(prop in o) {
		if(o.hasOwnProperty(prop)) {
			copy[prop] = o[prop];
		}
	}
	return copy;
}

function get_gravatar(email, size) {
	// MD5 (Message-Digest Algorithm) by WebToolkit
    var MD5=function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]|(G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};
	var size = size || 80;

	return 'http://www.gravatar.com/avatar/' + MD5(email) + '.jpg?s=' + size;
}

function Login() {
	log("Login() called.");
	document.getElementById("username").focus();

	//put the user-entered data into the DefaultSettings array.
	DefaultSettings.username = document.getElementById("username").value;
	DefaultSettings.password = document.getElementById("password").value;
	DefaultSettings.lastAccessTime = Math.round(new Date().getTime() / 1000);
	saveSettingsToStorageMechanism();

	KanbanLogin();

	document.getElementById("username").value = '';
	document.getElementById("password").value = '';
}

function KanbanLogin() {
	try {
		var retObj = Mantis.Login(DefaultSettings.username, DefaultSettings.password);
		Kanban.CurrentUser = new KanbanUser(retObj.account_data);
		Kanban.CurrentUser.Password = DefaultSettings.password;

		document.getElementById("gravatarcurrentuser").style.backgroundImage = "url(" + get_gravatar_image_url(Kanban.CurrentUser.Email, 35) + ")";

	} catch(e) {
		var form = document.getElementById("loginButton");
		$(form).before('<center><div class="alert alert-danger text-center" style="width:320px !important"><b>Error:</b> ' + e.message + '<button type="button" class="close" data-dismiss="alert">&times;</button></div><center>');
		return;
	}

	StartLoading();
	LoadSettingsFromLocalStorage();
	if(DefaultSettings.kanbanListWidth == undefined) {

		DefaultSettings.kanbanListWidth = getStyleRule(".kanbanlist", "width");
	}

	Kanban.ApplySettingsAtLogin();

	if(urlParams.project) {
		document.getElementById("seletedproject").value = urlParams.project;
	}

	LoadKanbanProjects();
	BuildProjectsGUI();

	HideLoginArea();
	ShowProjectArea();

	if(urlParams.issue) {
		document.getElementById("searchfield").value = urlParams.issue;
		SearchForStory();
		return;
	}

	$('#scrumMode').bootstrapSwitch();
	$('#scrumMode').on('switchChange.bootstrapSwitch', function(event, state) {
		Kanban.ScrumMode = state ? "Review" : "Planif";
		SelectProject();
	});

	Mantis.Preload();
	StopLoading();
}

function DeleteIssue(kanbanIssue) {
	try {
		if(confirm("Are you sure you want to delete this issues?")) {
			StartLoading();
			var storyID = $("#edit-story-id").val();
			var kanbanStory = Kanban.GetStoryByFieldValue("ID", storyID);

			Mantis.IssueDelete(kanbanStory.ID, function() {
				try {
					StopLoading();
					kanbanStory.Delete();
				} catch(ex) {
					StopLoading();
				}
			});
		}
	} catch(e) {
		StopLoading();
	}
}

function HideLoginArea() {
	document.getElementById("loginarea").style.display = "none";
}

function ShowLoginArea() {
	document.getElementById("loginarea").style.display = "inline-block";
}

function ShowProjectArea() {
	document.getElementById("projectarea").style.display = "block";
	document.getElementById("contentarea").style.display = "block";
	document.getElementById("priorities-displayer").style.display = "block";

}

function HideProjectArea() {
	document.getElementById("projectarea").style.display = "none";
	document.getElementById("contentarea").style.display = "none";
	document.getElementById("priorities-displayer").style.display = "none";
}

function modifyStyleRule(selectorText, style, value) {
	var sheets = document.styleSheets;
	var sheet, rules, rule;
	var i, j, k, l;

	for(i = 0, iLen = sheets.length; i < iLen; i++) {
		sheet = sheets[i];

		// W3C model
		try {
			if(sheet.cssRules) {
				rules = sheet.cssRules;

				for(j = 0, jLen = rules.length; j < jLen; j++) {
					rule = rules[j];

					if(rule.selectorText == selectorText) {
						rule.style[style] = value;
					}
				}
			} else if(sheet.rules) {
				rules = sheet.rules;

				for(k = 0, kLen = rules.length; k < kLen; k++) {
					rule = rules[k];

					// An alternative is to just modify rule.style.cssText,
					// but this way keeps it consistent with W3C model
					if(rule.selectorText == selectorText) {
						rule.style[style] = value;

						// Alternative
						// rule.style.cssText = value;
					}
				}
			}
		} catch(e) {
		}
	}
}

function getStyleRule(selectorText, style, value) {
	try {
		var sheets = document.styleSheets;
		var sheet, rules, rule;
		var i, j, k, l;

		for(i = 0, iLen = sheets.length; i < iLen; i++) {
			sheet = sheets[i];

			// W3C model
			if(sheet.cssRules) {
				rules = sheet.cssRules;

				for(j = 0, jLen = rules.length; j < jLen; j++) {
					rule = rules[j];

					if(rule.selectorText == selectorText) {
						if(rule.style[style] == undefined)
							return "";
						return rule.style[style];
					}
				}
			} else if(sheet.rules) {
				rules = sheet.rules;

				for(k = 0, kLen = rules.length; k < kLen; k++) {
					rule = rules[k];

					// An alternative is to just modify rule.style.cssText,
					// but this way keeps it consistent with W3C model
					if(rule.selectorText == selectorText) {
						if(rule.style[style] == undefined)
							return "";
						return rule.style[style];

						// Alternative
						// rule.style.cssText = value;
					}
				}
			}
		}
		/// We didn't find the value so return nothing
		return "";
	} catch(e) {
		return "";
	}
}

/* Remove rule from supplied sheet
 */
function removeRule(sheet, rule) {

	// W3C model
	if(typeof sheet.deleteRule == 'function') {
		sheet.deleteRule(rule);

		// IE model
	} else if(sheet.removeRule) {
		sheet.removeRule(rule);
	}
}

/* Add rule from supplied sheet
 ** Rule is added as last rule in sheet
 */
function addRule(sheet, selectorText, value) {

	// W3C model
	if(typeof sheet.insertRule == 'function') {
		sheet.insertRule(selectorText + ' {' + value + '}', sheet.cssRules.length);

		// IE model
	} else if(sheet.addRule) {
		sheet.addRule(selectorText, value, sheet.rules.length);
	}
}

function Logout() {
	Kanban.Lists = [];
	Kanban.Stories = [];
	Kanban.Projects = [];
	Kanban.ClearListGUI();

	Mantis.ClearForLogout();

	DefaultSettings.username = '';
	DefaultSettings.password = '';
	saveSettingsToStorageMechanism();
	document.getElementById("username").value = '';
	document.getElementById("password").value = '';

	HideProjectArea();
	ShowLoginArea();
}

function SelectProject(openStoryID) {
	StartLoading();
	CloseEditStory();
	CloseAddStory();

	Mantis.CurrentProjectID = document.getElementById("seletedproject").value;

	//put selected project into localstorage so that next time the user logs in it loads their current project.
	DefaultSettings.currentProject = Mantis.CurrentProjectID;
	saveSettingsToStorageMechanism();

	Kanban.Lists = [];
	Kanban.Stories = [];
	Kanban.AssignedUsers = [];
	Kanban.AssignedUsersSelected = [];
	Kanban.AssignedPrioritySelected = [];
	Kanban.AssignedSeveritySelected = [];
	var assignedUserContainer = document.getElementById("project-users-gravatars-container");
	try {
		while(assignedUserContainer.childNodes.length > 0) {
			assignedUserContainer.removeChild(assignedUserContainer.firstChild);
		}
	} catch(e) {
	}

	Kanban.ClearListGUI();
	Mantis.CurrentProjectID = document.getElementById("seletedproject").value;
	BuildMantisFilterList();
	BuildKanbanListFromMantisStatuses();
	Kanban.BuildListGUI();
	AutoAdjustListWidth();
	VerifyDefaultFitlers();

	if(Kanban.CurrentProject.ParentProject) {
		document.getElementById("selected-project-name").innerHTML = Kanban.CurrentProject.ParentProject.Name + "&nbsp;&nbsp;/&nbsp;&nbsp;" + Kanban.CurrentProject.Name;
	} else if(Mantis.CurrentProjectID == 0) {
		document.getElementById("selected-project-name").innerHTML = "All projects";
	} else {
		document.getElementById("selected-project-name").innerHTML = Kanban.CurrentProject.Name;
	}

	if(Mantis.DefaultFilterID !== null && Mantis.DefaultFilterID != 0) {
		window.setTimeout(function(filterID, retObj) {
			LoadFilterAsync(Mantis.DefaultFilterID, 0, Mantis.NumberOfIssueToLoad, function(filterID, retObj) {
				DoneLoadingIssuesCallback(filterID, retObj);
				if(document.getElementById("searchfield").value != "") {
					SearchForStory(false);
				}
				BuildKanbanAssignedUsersGUI();
				KanbanRememberFilters();
				RefreshStoriesDisplay();
			});
		}, 10);
		if(Mantis.ClosedIssuesFilterID !== null) {
			window.setTimeout("LoadFilterAsync(Mantis.ClosedIssuesFilterID, 1, Kanban.NumberOfClosedMessagesToLoad, DoneLoadingIssuesCallback)", 10);
		}
	} else {
		var retObj = Mantis.ProjectGetIssues(Mantis.CurrentProjectID, 0, Mantis.NumberOfIssueToLoad);
		CreateKanbanStoriesFromMantisIssues(retObj);
		BuildKanbanAssignedUsersGUI();
		KanbanRememberFilters();
		RefreshStoriesDisplay();
		$(".tempLoadingDiv").hide();//hide the loading gifs
		if(document.getElementById("searchfield").value != "") {
			SearchForStory(false);
		}
	}

	StopLoading();
}

function VerifyDefaultFitlers() {
	var foundClosedFilter = false;
	var foundFilter = false;
	for(var fcount = 0; fcount < Mantis.ProjectFilterList.length; fcount++) {
		if(Mantis.ProjectFilterList[fcount].id == Mantis.DefaultFilterID) {
			foundFilter = true;
		}
	}
	for(var fcount = 0; fcount < Mantis.ProjectFilterList.length; fcount++) {
		if(Mantis.ProjectFilterList[fcount].id == Mantis.ClosedIssuesFilterID) {
			foundClosedFilter = true;
		}
	}
	if(!foundFilter)
		Mantis.DefaultFilterID = 0;
	if(!foundClosedFilter)
		Mantis.ClosedIssuesFilterID = null;
}

function UpdateFilter(filterID) {
	for(var i = 0; i < Mantis.ProjectFilterList.length; i++) {
		if(Mantis.ProjectFilterList[i].id == filterID) {
			$('#selectedFilterText').text(Mantis.ProjectFilterList[i].name);
			Mantis.DefaultFilterID = filterID;
			SelectProject();
			return;
		}
	}

	$('#selectedFilterText').text(langObj.textSelectFilter);
	Mantis.DefaultFilterID = 0;
	SelectProject();
}

function Refresh(refreshTime) {
	DefaultSettings.refresh = refreshTime;
	saveSettingsToStorageMechanism();
	UpdateRefreshDisplay();

	Kanban.RefreshTimeLocalStorage();
	Kanban.ControlStayLoggedIn();
	SelectProject();
}

function UpdateRefreshDisplay() {
	DefaultSettings.FiltersUsers = (undefined !== Kanban.AssignedUsersSelected) ? Kanban.AssignedUsersSelected : [];
	DefaultSettings.FiltersPriority = (undefined !== Kanban.AssignedPrioritySelected) ? Kanban.AssignedPrioritySelected : [];
	DefaultSettings.FiltersSeverity = (undefined !== Kanban.AssignedSeveritySelected) ? Kanban.AssignedSeveritySelected : [];
	saveSettingsToStorageMechanism();

	if(DefaultSettings.refresh > 0) {
		var langMinutes = (DefaultSettings.refresh / 60) > 1 ? langObj.textManyMinutes : langObj.textOneMinute;
		$('#selected-refresh').text((DefaultSettings.refresh / 60) + ' ' + langMinutes);

		if(Kanban.refreshInterval != null) {
			clearInterval(Kanban.refreshInterval);
		}
		Kanban.refreshInterval = setInterval("RefreshDisplay();", DefaultSettings.refresh * 1000);
	} else {
		$('#selected-refresh').text(langObj.textReload);
	}
}

function RefreshDisplay() {
	var editing = document.getElementById("kanbancontent").getAttribute("editing");

	if(editing != "true") {
		Kanban.ControlStayLoggedIn();
		SelectProject();
	}
}

function BuildMantisFilterList() {

	log("BuildMantisFilterList() called.");

	var filterList = document.getElementById("filterlist");

	var filterListArray = Mantis.FilterGet(Mantis.CurrentProjectID)
	Mantis.ProjectFilterList = filterListArray;

	while(filterList.children.length > 0) {
		filterList.removeChild(filterList.children[0]);
	}
	filterList.innerHTML = "<li><a href=\"#\" onclick=\"UpdateFilter(0);\">Clear filter</a></li><li role=\"separator\" class=\"divider\"></li>";

	for(var i = 0; i < filterListArray.length; i++) {
		var filter = filterListArray[i];

		var filterItem = document.createElement("li");
		filterItem.setAttribute("filterid", filter.id);

		var filterItemLink = document.createElement("a");
		filterItemLink.setAttribute("href", "#");
		filterItemLink.setAttribute("filterid", filter.id);
		filterItemLink.setAttribute("onclick", "UpdateFilter(" + filter.id + ");");
		filterItemLink.innerHTML = filter.name;
		filterItem.appendChild(filterItemLink);

		filterList.appendChild(filterItem);

		// Update selected filter
		if(filter.id == Mantis.DefaultFilterID) {
			$('#selectedFilterText').text(filter.name);
		}
	}
}

function LoadFilterAsync(FilterID, Page, Limit, Callback) {
	try {
		var retObj = Mantis.FilterGetIssues(Mantis.CurrentProjectID, FilterID, Page, Limit);
		Callback(FilterID, retObj);
	} catch(e) {
		try {
			var retObj = Mantis.ProjectGetIssues(Mantis.CurrentProjectID, 0, 0);
			CreateKanbanStoriesFromMantisIssues(retObj);
		} catch(e) {
			if(Mantis.DefaultFilterID == FilterID)
				Mantis.DefaultFilterID = 0;
			if(Mantis.ClosedIssuesFilterID == FilterID)
				Mantis.ClosedIssuesFilterID = null;
			saveSettingsToStorageMechanism();
			StopLoading();
			alert("Error Loading Stories For Filter: " + e.message);
		}

	} finally {
		StopLoading();
	}
}

function DoneLoadingIssuesCallback(filterID, retObj) {
	CreateKanbanStoriesFromMantisIssues(retObj);
	LoadingIssuesList.splice(LoadingIssuesList.indexOf(filterID) - 1, 1);
	if(LoadingIssuesList.length == 0) {
		StopLoading();
	}
	$(".tempLoadingDiv").hide();//hide the loading gifs
}

function StartLoading() {
	document.getElementById("loadedimage").style.visibility = 'hidden';
	document.getElementById("loadingimage").style.visibility = 'visible';
}

function StopLoading() {
	document.getElementById("loadedimage").style.visibility = 'visible';
	document.getElementById("loadingimage").style.visibility = 'hidden';
}

function BuildKanbanListFromMantisStatuses() {
	var hasCutomFieldForStatus = false;
	Kanban.UsingCustomField = false;
	if(Mantis.ProjectCustomFields.length > 0) {
		for(var cf = 0; cf < Mantis.ProjectCustomFields.length; cf++) {
			var customfield = Mantis.ProjectCustomFields[cf]
			if(customfield.field.name == Kanban._listIDField) {
				hasCutomFieldForStatus = true;
				Kanban.UsingCustomField = true;
				var possiblevalues = customfield.possible_values.split("|");
				for(var pv = 0; pv < possiblevalues.length; pv++) {
					possiblevalue = possiblevalues[pv];
					var newKanbanList = new KanbanList(possiblevalue);
					newKanbanList.UsesCustomField = true;

					if(Kanban.ScrumModes[Kanban.ScrumMode][newKanbanList.ID]) {
						Kanban.AddListToArray(newKanbanList);
					}
				}
			}
		}
	}
	if(!Kanban.UsingCustomField) {
		for(var si = 0; si < Mantis.Statuses.length; si++) {
			var status = Mantis.Statuses[si]
			Kanban.AddListToArray(new KanbanList(status));
		}
	}
}

function SwapSelectedProject(newProjectID) {
	var nodeList = document.getElementsByClassName("projectbutton");
	for(var i = 0; i < nodeList.length; i++) {
		if(nodeList[i].id == newProjectID) {
			nodeList[i].setAttribute("selected", "true");
		} else {
			nodeList[i].setAttribute("selected", "false");
		}
	}
}

function LoadKanbanProjects() {
	for(var i = 0; i < Mantis.UserProjects.length; i++) {
		var parentProject = new KanbanProject(Mantis.UserProjects[i]);
		Kanban.Projects[Kanban.Projects.length] = parentProject;
		if(parentProject.ProjectSource.subprojects.length > 0) {
			AddProjectandSubProjectsToList(parentProject.ProjectSource.subprojects, parentProject, 1);
		}
	}
}

function AddProjectandSubProjectsToList(projectList, parent, niv) {
	for(var q = 0; q < projectList.length; q++) {
		var subProject = new KanbanProject(projectList[q]);
		Kanban.Projects[Kanban.Projects.length] = subProject;
		subProject.ParentProject = parent;
		subProject.ProjectNiv = niv;
		parent.SubProjects[parent.SubProjects.length] = subProject;
		if(subProject.ProjectSource.subprojects.length > 0) {
			AddProjectandSubProjectsToList(subProject.ProjectSource.subprojects, subProject, niv + 1);
		}
	}
}

function BuildProjectUI(project, parent, preSelectedProjectID) {
	var projectLI = document.createElement("li");
	var projectDiv = document.createElement("a");
	projectDiv.setAttribute("id", "project" + project.ID);
	projectDiv.setAttribute("href", "");
	projectDiv.setAttribute("onclick", "document.getElementById('seletedproject').value = '" + project.ID + "'; document.getElementById('searchfield').value = ''; SelectProject(); SwapSelectedProject(this.id); return false;");
	projectDiv.setAttribute("selected", project.ID == preSelectedProjectID ? "true" : "false");
	if(project.ProjectNiv > 0) {
		projectLI.classList.add("subproject");
		projectLI.classList.add("subprojectNiv" + project.ProjectNiv);
	}
	projectDiv.innerHTML = project.Name;
	projectLI.appendChild(projectDiv);

	parent.appendChild(projectLI);

}

function BuildProjectsGUI() {
	var projectDivContainer = document.getElementById("projectlist");
	var preSelectedProjectID = document.getElementById("seletedproject").value == "" ? Kanban.Projects[0].ID : document.getElementById("seletedproject").value;
	try {
		while(projectDivContainer.childNodes.length > 0) {
			projectDivContainer.removeChild(projectDivContainer.firstChild);
		}
	} catch(e) {
	}

	projectDivContainer.innerHTML = "<li><a href=\"#\" onclick=\"document.getElementById('seletedproject').value = '0'; document.getElementById('searchfield').value = ''; SelectProject(); SwapSelectedProject(0); return false;\">All projects</a></li><li role=\"separator\" class=\"divider\"></li>";

	for(var i = 0; i < Kanban.Projects.length; i++) {
		var thisProject = Kanban.Projects[i];
		BuildProjectUI(thisProject, projectDivContainer, preSelectedProjectID);
	}

	if(document.getElementById("seletedproject").value == "" || !Kanban.HasProject(document.getElementById("seletedproject").value)) {
		document.getElementById("seletedproject").value = Kanban.Projects[0].ID;
	}
}

function GetUserColor(digits) {
	if(digits.length > 3)
		digits = digits.substring(0, 3)
	if(digits.length < 3)
		digits = pad(3, digits, "0");

	var colorObject = GetColorCodeFor3Digits(digits);
	var textContrast = GetColorContrastForRBG(colorObject.first, colorObject.second, colorObject.third);
	return "color: " + textContrast + "; background: #" + rgbToHex(colorObject.first, colorObject.second, colorObject.third) + ";";
}

function BuildKanbanAssignedUsersGUI() {
	CreateListOfAssignedStories();

	var kanbanUserListContainer = document.getElementById("project-users-gravatars-container");
	kanbanUserListContainer.innerHTML = "";

	var labelDiv = document.createElement("div");
	labelDiv.innerHTML = "Users:";
	labelDiv.setAttribute("id", "gravatarlabel");
	kanbanUserListContainer.appendChild(labelDiv);

	var userListDiv = document.createElement("div");
	userListDiv.setAttribute("id", "gravatarusers");
	kanbanUserListContainer.appendChild(userListDiv);

	var thisUser = Kanban.AssignedUsers[kbu];
	var userGravatar = document.createElement("div");
	userGravatar.innerHTML = "X";
	userGravatar.setAttribute("class", "gravatarcontainer userlistgravataritems cp");
	userGravatar.setAttribute("style", "color: #fff; background: #e77; text-align:center; padding-top:5px; vertical-align:middle;");

	userGravatar.setAttribute("data-toggle", "tooltip");
	userGravatar.setAttribute("data-placement", "bottom");
	userGravatar.setAttribute("data-trigger", "hover");
	userGravatar.setAttribute("data-html", "true");

	userGravatar.setAttribute("title", "Nobody");
	userGravatar.setAttribute("data-content", "");
	userGravatar.setAttribute("id", "ug");

	userListDiv.appendChild(userGravatar);
	for(var kbu = 0; kbu < Kanban.AssignedUsers.length; kbu++) {
		var thisUser = Kanban.AssignedUsers[kbu];

		var userGravatar = document.createElement("div");
		var shortName = thisUser.UserName.substring(0, 1).toUpperCase() + thisUser.UserName.substring(1, 2);
		var userEmail = (thisUser.Email === undefined) ? '' : thisUser.Email;
		userGravatar.innerHTML = shortName;

		userGravatar.setAttribute("class", "gravatarcontainer userlistgravataritems cp");
		userGravatar.setAttribute("style", GetUserColor(thisUser.UserName.substring(0, 3)) + " text-align:center; padding-top:5px; vertical-align:middle;");

		//userGravatar.setAttribute("data-container", "body");
		userGravatar.setAttribute("data-toggle", "tooltip");
		userGravatar.setAttribute("data-placement", "bottom");
		userGravatar.setAttribute("data-trigger", "hover");
		userGravatar.setAttribute("data-html", "true");

		//userGravatar.setAttribute("data-content", thisUser.Email);
		//userGravatar.setAttribute("data-trigger", "hover");
		userGravatar.setAttribute("title", thisUser.Name);
		userGravatar.setAttribute("data-content", "<b>" + userEmail + "</b><div style=\"color:#000 !important; border: solid 1px #bbb; padding-left: 5px;" + GetStyleCodeFor3DigitsHalfShaded(thisUser.UserName.substring(0, 3)) + "\">" + shortName + "</div>");
		userGravatar.setAttribute("id", "ug" + thisUser.ID);

		kanbanUserListContainer.appendChild(userGravatar);
	}

	$(".userlistgravataritems").click(function() {
		var id = $(this).attr("id").substr(2);

		if(!$(this).hasClass("selected")) {
			$(this).addClass("selected");
			$(this).css("outline", "medium solid #dd2222");
			Kanban.AssignedUsersSelected.push(id);
		} else {
			$(this).removeClass("selected");
			$(this).css("outline", "");

			var index = Kanban.AssignedUsersSelected.indexOf(id);
			if(index > -1) {
				Kanban.AssignedUsersSelected.splice(index, 1);
			}
		}

		RefreshStoriesDisplay();
	});

	$(function() {
		$("[data-toggle='tooltip']").popover({
			html : true
		});
	});
}

function KanbanRememberFilters() {
	var userList = DefaultSettings.FiltersUsers;
	var priorityList = DefaultSettings.FiltersPriority;
	var severityList = DefaultSettings.FiltersSeverity;

	if(undefined === userList) return;

	if(userList.length > 0) {
		for(var ui = 0; ui < userList.length; ui++) {
			if(!$("#ug"+userList[ui]).hasClass("selected")) {
				$("#ug"+userList[ui]).addClass('selected');
				$("#ug"+userList[ui]).css("outline", "medium solid #dd2222");
			}

			Kanban.AssignedUsersSelected.push(userList[ui]);
		}
	}
	if(priorityList.length > 0) {
		for(var pi = 0; pi < priorityList.length; pi++) {
			if(!$("#op_priority_"+priorityList[pi]).hasClass('borders')) {
				$("#op_priority_"+priorityList[pi]).addClass('borders');
			}

			Kanban.AssignedPrioritySelected.push(priorityList[pi]);
		}
	}
	if(severityList.length > 0) {
		for(var si = 0; si < severityList.length; si++) {
			if(!$("#op_severity_"+severityList[si]).hasClass('borders')) {
				$("#op_severity_"+severityList[si]).addClass('borders');
			}

			Kanban.AssignedSeveritySelected.push(severityList[si]);
		}
	}
}

function AssignPriority(id) {
	AssignOptions(id, 'priority');
}

function AssignSeverity(id) {
	AssignOptions(id, 'severity');
}

function AssignOptions(id, type) {
	var obj = $("#op_" + type + "_" + id);
	var Assigned = (type === 'severity') ? Kanban.AssignedSeveritySelected: Kanban.AssignedPrioritySelected;

	if(!obj.hasClass("borders")) {
		obj.addClass("borders");
		Assigned.push(id);
	} else {
		obj.removeClass("borders");

		var index = Assigned.indexOf(id);
		if(index > -1) {
			Assigned.splice(index, 1);
		}
	}

	RefreshStoriesDisplay();
}

function RefreshStoriesDisplay() {
	for(var si = 0; si < Kanban.Stories.length; si++) {
		var story = Kanban.Stories[si];

		var conditionUser = ((Kanban.AssignedUsersSelected.indexOf(story.HandlerID) > -1) || (Kanban.AssignedUsersSelected.length == 0));
		var conditionPriority = ((Kanban.AssignedPrioritySelected.indexOf(story.PriorityID) > -1) || (Kanban.AssignedPrioritySelected.length == 0));
		var conditionSeverity = ((Kanban.AssignedSeveritySelected.indexOf(story.SeverityID) > -1) || (Kanban.AssignedSeveritySelected.length == 0));

		if(conditionUser) {
			story.Element.style.display = "block";

			if(conditionPriority) {
				story.Element.style.display = "block";

				if(conditionSeverity) {
					story.Element.style.display = "block";
				} else {
					story.Element.style.display = "none";
				}
			} else {
				story.Element.style.display = "none";
			}
		} else {
			story.Element.style.display = "none";
		}
	}

	UpdateKanbanListTitle();
}

function SelectFirstMantisProjectUserAccessAccessTo(obj, doc) {
	Mantis.CurrentProjectID = obj[0].id;
}

function KanbanAssignedUserInList(userID) {
	for(var kus = 0; kus < Kanban.AssignedUsers.length; kus++) {
		var thisUser = Kanban.AssignedUsers[kus];
		if(thisUser.ID == userID) {
			return true;
		}
	}
	return false;
}

function CreateListOfAssignedStories() {
	for(var si = 0; si < Kanban.Stories.length; si++) {
		var story = Kanban.Stories[si];
		try {
			if(!KanbanAssignedUserInList(story.AssignedToUser.ID)) {
				Kanban.AssignedUsers[Kanban.AssignedUsers.length] = story.AssignedToUser;
			}
		} catch(e) {

		}
	}
	Kanban.AssignedUsers.sort(compareUsers);
}

function compareUsers(a, b) {
	if(a.Name < b.Name) {
		return -1;
	}
	if(a.Name > b.Name) {
		return 1;
	}
	return 0;
}

function CreateKanbanStoriesFromMantisIssues(obj) {
	for(var is = 0; is < obj.length; is++) {
		var newStory = new KanbanStory(obj[is])
		Kanban.AddStoryToArray(newStory);
	}

	UpdateKanbanListTitle();
}

function AutoLogin() {
	//use this function to check to see if the user has local storage for username and password and if they do log in automatically
	if(Modernizr.localstorage) {
		log("window.localStorage is available!");
		LoadSettingsFromLocalStorage();

		if(DefaultSettings.password != "") {
			KanbanLogin(DefaultSettings.username, DefaultSettings.password);
		}
	}
	else {
		log("no native support for HTML5 storage :( maybe try dojox.storage or a third-party solution");
	}
}

function OpenLightBox(itemid) {
	document.getElementById("lightboximage").setAttribute("src", $(itemid)[0].src);
	document.getElementById("attachmentdisplay").style.display = "block";
}

function CloseLightBox(itemid) {
	document.getElementById("attachmentdisplay").style.display = "none";
}

function LoadSettingsFromLocalStorage() {
	//check for users settings and login information
	//if the settings exist load them into the DefaultSettings
	if(localStorage.mantiskanbanSettings != "" && localStorage.mantiskanbanSettings != null && localStorage.mantiskanbanSettings != "undefined")
	{
		log("Local settings exists!!!");
		DefaultSettings = JSON.parse(localStorage.mantiskanbanSettings);
		log("loaded user saved settings into the DefaultSettings");
		log(JSON.stringify(DefaultSettings));

		//if the current project in the settings is not the same as the project default then load it.
		if(DefaultSettings.currentProject != Mantis.CurrentProjectID) {
			log("setting user-saved filter as default project: " + DefaultSettings.currentProject);
			Mantis.CurrentProjectID = DefaultSettings.currentProject;
			document.getElementById("seletedproject").value = Mantis.CurrentProjectID;
			log("CurrentProjectID set to " + Mantis.CurrentProjectID);
		}

		if(DefaultSettings.refresh != null) {
			UpdateRefreshDisplay();
		}

		//put the username in the field if the DefaultSettings.lastAccessTime is less than 30 days ago
		Kanban.ControlStayLoggedIn(); // only refres browser
	}
	//otherwise load the DefaultSettings
	else
	{
		log("Local storage don't exist!!");
		localStorage.setItem("mantiskanbanSettings", JSON.stringify(DefaultSettings));
		log("loaded DefaultSettings in to user saved settings.");
		log(localStorage.mantiskanbanSettings);
	}
}

function saveSettingsToStorageMechanism() {
	log("saveCurrentSettings() called.");
	if(Modernizr.localstorage) {
		localStorage.setItem("mantiskanbanSettings", JSON.stringify(DefaultSettings));
		log("local stored settings: " + localStorage.getItem("mantiskanbanSettings"));
		log("defaultSettings: " + JSON.stringify(DefaultSettings));
	}
	else {
		//put the cookie version of the saveCurrentSettings() here.

	}

}

function AutoAdjustListWidth() {
	var contentArea = document.getElementById("kanbancontent")
	var newWidth = FitColsToScreen();
	document.getElementById("settings-list-width").value = newWidth;
	modifyStyleRule(".kanbanlist", "width", newWidth);
}

function FitColsToScreen() {
	var newColumnWidth = Math.floor((document.getElementById("contentarea").clientWidth - 80) / Kanban.Lists.length) - 2; //-80 for padding compensation
	document.getElementById("settings-list-width").value = newColumnWidth + "px";
	return newColumnWidth + "px";
}