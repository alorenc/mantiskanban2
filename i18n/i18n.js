/* global langObj */

//====================================================
// File: i18n.js
// data: 2015/12/06
// Ctor: Zipher
// Note: Localization for html
//====================================================

//----------------------------------------------------------
/*
 ##Step 1: Add localiztion files
 Path is i18n/lang/{lang}.js or minify i18n/lang/{lang}.min.js
 File name is {lang}.js. Ex: en-us.js for traditional English
 Context:
 var langObj = {
	//"stringId": "stringContext",
	"delete": "Date",
	"add": "Add issue"
 };

 ##Step 2: Load script in html
	<script language="javascript" type="text/javascript" src="i18n/i18n.js"></script>

 ##Step 3: Lookup "stringContext" by "stringId" in html
	<div>delete</div>
 sould be changed to
	 <div class="i18ntext" data-text-id="delete"></div>
 */

/**
 * Load Language
 *
 * @returns
 */
$(function() {
	//load language file
	var userLang = (navigator.language || navigator.userLanguage).toLowerCase();
	var urlLang = "";

	switch(userLang) {
		case "zh-tw":
			urlLang = getLink("zh-tw");
			break;
		case ("pl" || "pl-pl"):
			urlLang = getLink("pl-pl");
			break;
		default:
			urlLang = getLink("en-us");
			break;
	}

	loadScript(urlLang, onLangLoaded);
});

/**
 * Get url to language file
 *
 * @param {string} nameFile Name file
 * @returns {String}
 */
function getLink(nameFile) {
//	return fileExists("i18n/lang/" + nameFile + ".min.js") ? "i18n/lang/" + nameFile + ".min.js" : "i18n/lang/" + nameFile + ".js";
	return "i18n/lang/" + nameFile + ".js"
}

/**
 * Check if the file exists
 *
 * @param {string} url
 * @returns {Boolean}
 */
function fileExists(url) {
	if(window.XMLHttpRequest) {
		// code for IE7+, Firefox, Chrome, Opera, Safari
		var http = new XMLHttpRequest();
	} else {
		// code for IE6, IE5
		var http = new ActiveXObject("Microsoft.XMLHTTP");
	}
	http.open('HEAD', url, false);
	http.send();
	return http.status != 404;
}

/**
 * Load Javascript file
 *
 * @param {String} src URL loaded file
 * @param {onLangLoaded} callback Function
 * @returns
 */
function loadScript(src, callback) {
	var my_awesome_script = document.createElement('script');
	my_awesome_script.setAttribute('language', 'javascript');
	my_awesome_script.setAttribute('type', 'text/javascript');
	my_awesome_script.setAttribute('src', src);

	if(callback) {
		my_awesome_script.onload = callback;
	}

	document.head.appendChild(my_awesome_script);
}

/**
 * Convert text to language selected
 *
 * @returns String
 */
function onLangLoaded() {
	$(".i18ntext").each(function() {
		var str = $(this).attr("data-text-id");
		var split = str.split("_");

		if(split.length > 1) {
			$(this).text(langObj[split[0]][split[1]]);
		} else {
			$(this).text(langObj[str]);
		}
	});
}