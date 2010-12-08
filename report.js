var logParser = require('./logParser');

var getFromPath = function(root, path, force) {
	var context = root, paths = ((path === '...') ? [path] : path.split('.'));
	if (path == null || path == '') return root;
	return paths.every(function(path){
		if (force && !(path in context)) context[path] = {};
		return context = context[path];
	}) && context || null;
};

function display(obj, tablevel){
	var cur, line, keys = Object.keys(obj).sort();
	tablevel = tablevel || "\t";
	for(var p = 0, len = keys.length; p < len; ++p) {
		cur = obj[keys[p]];
		if(typeof cur == 'object') {
			console.log(tablevel + keys[p]);
			display(cur, tablevel + "\t");
		}
		else {
			console.log(tablevel + keys[p] + ": " + cur);
		}
	}
}

function substitute(str, object, regexp){
	return str.replace(regexp || (/\\?\{([^{}]+)\}/g), function(match, name){
		if (match.charAt(0) == '\\') return match.slice(1);
		return (object[name] != undefined) ? object[name] : '';
	});
}

function getVals(arr, col){
	return arr.map(function(item){
		return (typeof item === 'function' ? item(col) : ('{' + item + '}'));
	}).join('.');
}

function getValsSubstitute(arr, col) {
	return substitute(getVals(arr, col), col);
}

var ReportMulti = exports.ReportMulti = function(reports, globalFilter){
		this.reports = reports;
		this.filter = globalFilter;
	}
	, reportCallAll = function(attr){
		return function(){
			var args = Array.prototype.slice.call(arguments);
			this.reports.forEach(function(report){
				report[attr].apply(report, args);
			});
		};
	};

ReportMulti.prototype = { data: (function(){
		var callAllData = reportCallAll('data');
		return function(col){
			if (this.filter && !this.filter(col)) return;
			callAllData.call(this, col);
		};
	})()
	, finalize: reportCallAll('finalize')
	, display: reportCallAll('display')
	, name: 'MultiReport'
};


var count = exports.count = function(agg, name, col){
		agg[name] = agg[name] || 0;
		agg[name]++;
	}
	, sum = exports.sum = function(prop, init){
		init = init || 0;
		return function(agg, name, col){
			agg[name] = agg[name] || init;
			agg[name] += parseFloat(col[prop]);
		}
	};

var aggregatingReport = exports.aggregatingReport = function(name, pathTemplate, filter, aggregator){
	var data = {}
		, pathActivator;
	pathTemplate = pathTemplate || '';
	aggregator = aggregator || count;
	pathActivator = (typeof pathTemplate === 'string')
		? substitute
		: getValsSubstitute;
	return {
		data: function(col){
			var path = pathActivator(pathTemplate, col)
				, item;
			if (filter && !filter(col)) return;
			item = getFromPath(data, path, true);
			aggregator(item, name, col);
		}
		, finalize: function(){ this.display(); }
		, display: function(){
			console.log("\n" + name);
			display(data);
		}
	};
};

var pathbasedFilter = exports.pathbasedFilter = function(shouldCount, pathTemplate){
		var filter = {};
		return function(col){
			var path = substitute(pathTemplate, col);
			return shouldCount(getFromPath(filter, path, true), col);
		};
	}
	, onceFilter = exports.onceFilter = function(name, pathTemplate){ 
		return pathbasedFilter(function(obj, col){
			if(obj[col[name]]) return false;
			obj[col[name]] = true;
			return true;
		}, pathTemplate);
	}
	, onceIPFilter = exports.onceIPFilter = function(pathTemplate){
		return onceFilter('c-ip', pathTemplate);
	}
	, dateRangeFilter = exports.dateRangeFilter = function(begin, end){
		return function(col){
			return col.date >= begin && end && col.date <= end;
		}
	}
	, filterChain = exports.filterChain = function(filters){
		return function(col){
			return filters.every(function(filter){
				return filter(col);
			});
		};
	}
	, eqFilter = exports.eqFilter = function(prop, val){
		return function(col){
			return col[prop] == val;
		}	
	}
	, addHourPreprocess = exports.addHourPreprocess = function(col){
		return col.time.split(':')[0];
	};

