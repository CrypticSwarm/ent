var fs = require('fs')
	,	puts = console.log;

var associate = function(keys, values){
	var len = Math.min(keys.length, values.length), i = 0, ret = {};
	for(i = 0; i < len; ++i){
		ret[keys[i]] = values[i];
	}
	return ret;
};



var readDirectory = exports.readDirectory = function(directory, report, cb){
	cb = cb || function(){ report.finalize(); };
	fs.readdir(directory, function(err, files) {
		if(err) {
			puts('Error: ' + err);
			return;
		}
		var count = 0, fileLength = files.length, fields;
		var readFile = function(file){
			fs.stat(directory + file, function(err, st) {
				if (!err && st.isDirectory()) {
					readDirectory(directory + file + '/', report, function(){
						count++;
						readFile(files[count]);
					});
					return;
				}
				if(count >= fileLength) {
					cb();
					return;
				}
				fs.readFile(directory + file, function(err, data) {
					if(err) {
						puts(file + err);
						return;
					}
					
					count++;
					readFile(files[count]);
					if (/^\./.test(file)) return;
					data = String(data).trim().split('\n');
					data.forEach(function(line){
						if(/^#/.test(line)) {
							if(!fields && /^#Fields/.test(line)){
								fields = line.replace(/#Fields\s*:\s*/, '').split('\t');
							}
							return;
						}
						var cols = associate(fields, line.split('\t'));
						report.data(cols);
					});
				});
			});
		};
		readFile(files[count]);
	});
}

