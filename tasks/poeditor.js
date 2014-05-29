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

var wget = require('wget'),
	https = require('https'),
	colors = require('colors'),
	querystring = require('querystring');


module.exports = function(grunt) {
	
	grunt.registerMultiTask('poeditor',
	'Call POEditor\'s APIs & download exports from a grunt task',
	function() {
		
		var data = this.data;
		var opts = this.options();
		var done = this.async();
		
		if (data.command) {
			data.command.api_token = opts.api_token;
			callAPI(data.command, function(res) {
				
				console.log(res);
				done();
			});
		}
		
		else if (data.download) {
			
			data = data.download;
			data.api_token = opts.api_token;
			data.numLanguages = 0;
			for (var polang in data.languages)
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
	});
};

function getExports(data, handler) {
	
	var exports = {};
	var numLangs = data.numLanguages;
	for (var polang in data.languages) {
		
		callAPI({
			api_token: data.api_token,
			action: 'export',
			id: data.project_id,
			language: polang,
			type: data.type
		},
		function(res, command) {
			exports[command.language] = res.item;
			if (--numLangs == 0)
				handler(exports);
		});
	}
}

function downloadExports(exports, data, handler) {
	
	var paths = [];
	var numLangs = data.numLanguages;
	for (var polang in exports) {
		
		var url = exports[polang];
		var lang = data.languages[polang];
		var path = data.dest.replace('?', lang);
		
		paths.push(path);
		downloadExport(url, path, function() {
			
			if (--numLangs == 0)
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

