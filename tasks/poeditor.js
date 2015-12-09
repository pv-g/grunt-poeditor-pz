/*******************************************************************************
*
*   Grunt Plugin : POEditor
*   https://github.com/Philoozushi/grunt-poeditor-pz
*
*   Copyright (c) 2014 Philippe Vignau
*   Licensed under the MIT license.
*
********************************************************************************/

'use strict';

var fs = require('fs'),
	wget = require('wget-improved'),
	https = require('https'),
	colors = require('colors'),
	request = require('request'),
	querystring = require('querystring');

var grunt;

module.exports = function(g) {

	grunt = g;
	grunt.registerMultiTask('poeditor',
	'Call POEditor\'s APIs, upload & download from a grunt task',
	function() {

		var data = this.data;
		var opts = this.options();

		// any command
		if (data.command) {
			data.command.api_token = opts.api_token;
			var done = this.async();
			callAPI(data.command, function(res) {
				grunt.log.writeln(res);
				done();
			});
		}

		// upload
		else if (data.upload)
			upload(
				confLanguages(data.upload, opts), opts,
				this.files, this.async()
			);

		// download
		else if (data.download)
			download(
				confLanguages(data.download, opts), opts,
				this.async()
			);
	});
};

function upload(conf, opts, files, done) {

	// prepare data to upload
	var uploadData = [];

	files.forEach(function(file) {

		var locLang = file.dest;
		var poeLang = conf.languages.toPOE[locLang];

		var data = {
			action: 'upload',
			language: poeLang,
			file: fs.createReadStream('./'+file.src),
			api_token: opts.api_token
		};
		for (var param in conf)
			data[param] = conf[param];
		delete data.languages;

		uploadData.push(data);
	});

	// upload one by one, to avoid API "Too many upload" error
	function uploadNext() {

		var data = uploadData.splice(0,1)[0];

		grunt.log.writeln(('Uploading '+data.language+'...').cyan);
		postAPI(data, function(err, res, body) {

			if (err)
				grunt.log.error('FAILED... '+err);

			else {
				var res = JSON.parse(body).response;
				if (res.status == 'success')
					grunt.log.ok('SUCCESS!');
				else grunt.log.error('FAILED...');
				grunt.log.writeln(body.grey+'\n');
			}

			if (uploadData.length) {
				var sec = conf.intervalSecs;
				grunt.log.writeln(('(upload next in '+sec+' secs...)\n').grey);
				setTimeout(function(){uploadNext();}, sec*1000);
			}
			else done();
		});
	}

	uploadNext();
}

function download(data, opts, done) {

	data.api_token = opts.api_token;
	data.numLanguages = 0;
	for (var polang in data.languages.toLocal)
		data.numLanguages++;

	getExports(data, function(exports) {

		for (var polang in exports)
			grunt.log.writeln('->'.green, polang+':', exports[polang]);

		grunt.log.writeln('OK, now downloading...\n');
		downloadExports(exports, data, function(paths) {

			for (var i in paths)
				grunt.log.writeln('->'.red, paths[i]);

			grunt.log.writeln();
			grunt.log.ok('All done!');
			done();
		});
	});
}

function getExports(data, handler) {

	var exports = {};
	var numLangs = data.numLanguages;
	for (var polang in data.languages.toLocal) {

		callAPI({
			api_token: data.api_token,
			action: 'export',
			id: data.project_id,
			language: polang,
			type: data.type
		},
		function(res, command) {
			if (res.item)
				exports[command.language] = res.item;
			if (--numLangs == 0)
				handler(exports);
		});
	}
}

function downloadExports(exports, data, handler) {

	var numDownloads = 0;
	for (var polang in exports)
		numDownloads++;

	var paths = [];
	for (var polang in exports) {

		var url = exports[polang];
		var lang = data.languages.toLocal[polang];
		var path = data.dest.replace('?', lang);

		paths.push(path);
		downloadExport(url, path, function() {

			if (--numDownloads == 0)
				handler(paths);
		});
	}
}

function downloadExport(url, path, handler) {

	wget.download(url, path)
		.on('end', function(output) {
			handler();
		});
}

function confLanguages(obj, opts) {

	cleanLanguages(obj);
	if (!obj.languages)
		obj.languages = cleanLanguages(opts).languages;
	return obj;
}

function cleanLanguages(obj) {

	if (obj.languages) {
		var langs = {
			toPOE: {},
			toLocal: {}
		};
		var langdict = obj.languages;
		for (var poeL in langdict) {
			var locL = langdict[poeL];
			langs.toPOE[locL] = poeL;
			langs.toLocal[poeL] = locL;
		}
		obj.languages = langs;
	}
	return obj;
}

function callAPI(command, handler) {

	var postData = querystring.stringify(command);

	var req = https.request({
		host: 'poeditor.com',
		port: 443,
		path: '/api/',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': postData.length
		}
	},
	function(res) {
		res.setEncoding('utf8');
		res.on('data', function(data) {
			var res = JSON.parse(data);
			handler(res, command);
		});
	});

	req.write(postData);
	req.end();
}

function postAPI(data, handler) {

	request.post({
		url: 'https://poeditor.com/api/',
		formData: data
	}, handler);
}

