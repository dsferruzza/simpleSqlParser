function trim(str) {
	if (typeof str == 'string') return str.replace(/^\s+/g,'').replace(/\s+$/g,'');
	else return str;
}
// TODO: use Mootools trim() ?

// Split a string using a separator, only if this separator isn't beetween brackets
function protect_split(separator, str) {
	var sep = '######';
	str = str.replace(/(\((.+?)\)|"(.+?)"|'(.+?)'|`(.+?)`)/gi, function (match) {
		return match.replace(/,/g, sep);
	});
	str = str.split(',');
	str = str.map(function (item) {
		return trim(item.replace(new RegExp(sep, 'g'), ','));
	});
	return str;
}

// Add some # inside a string to avoid it to match a regex/split
function protect(str) {
	var result = '#';
	var length = str.length;
	for (var i = 0 ; i < length ; i++)  result += str[i] + "#";
	return result;
}

// Restore a string output by protect() to its original state
function unprotect(str) {
	var result = '';
	var length = str.length;
	for (var i = 1 ; i < length ; i = i + 2)  result += str[i];
	return result;
}



function parseSQL(query) {
	var output = '<strong>Query :</strong> ' + query + '<br><br>';
	
	// Remove semi-colons and keep only the first query
	var semi_colon = '###semi-colon###';
	query = query.replace(/[("'`].*;.*[)"'`]/g, function (match) {
		return match.replace(/;/g, semi_colon);
	});
	var eor = '###EOR###';
	query = query.replace(/;/g, eor);
	query = query.split(eor)[0];
	query = query.replace(new RegExp(semi_colon, 'g'), ';');
	
	// Define which words can act as separator
	var parts_name = ['SELECT', 'FROM', 'DELETE FROM', 'INSERT INTO', 'UPDATE', 'JOIN', 'LEFT JOIN', 'INNER JOIN', 'ORDER BY', 'GROUP BY', 'HAVING', 'WHERE', 'LIMIT', 'VALUES', 'SET'];
	var parts_order = new Array();
	
	// Hide words defined as separator but written inside brackets in the query
	query = query.replace(/\((.+?)\)/gi, function (match) {
		return match.replace(new RegExp(parts_name.join('|'), 'i'), protect);
	});
	
	// Write the position(s) in query of these separators
	parts_name.forEach(function (item) {
		var pos = 0;
		do {
			var part = query.indexOf(item, pos);
			if (part != -1) {
				parts_order[part] = item;	// Position won't be exact because the use of protect() (above) and unprotect() alter the query string ; but we just need the order :)
				pos = part + item.length;
			}
		}
		while (part != -1)
	});
	
	// Delete duplicates (caused, for example, by JOIN and LEFT JOIN)
	var busy_until = 0;
	parts_order.forEach(function (item, key, _this) {
		if (busy_until > key) delete parts_order[key];
		else {
			busy_until = parseInt(key) + item.length;
		
			// Replace JOIN by LEFT JOIN
			if (item == 'JOIN') parts_order[key] = 'LEFT JOIN';
		}
	});
	
	// Generate protected word list to reverse the use of protect()
	var words = parts_name.slice(0);
	words = words.map(function (item) {
		return protect(item);
	});
	words = words.join('|');
	
	// Display parts
	var parts = query.split(new RegExp(parts_name.join('|'), 'i'));
	var j = 0;
	parts_order.forEach(function (item, key) {
		j++;
		parts[j] = parts[j].replace(/\((.+?)\)/gi, function (match) {	// Unhide words precedently hidden with protect()
			return match.replace(new RegExp(words, 'i'), unprotect);
		});
		output += '<strong>' + item + '</strong> : ' + parts[j] + '<br>';
	});
	
	// Unhide words precedently hidden with protect()
	query = query.replace(/\((.+?)\)/gi, function (match) {
		return match.replace(new RegExp(words, 'i'), unprotect);
	});
	parts = parts.map(function (item) {
		return item.replace(/\((.+?)\)/gi, function (match) {
			return match.replace(new RegExp(words, 'i'), unprotect);
		});
	});
	
	// Define analysis functions
	var analysis = new Array();
	
	analysis['SELECT'] = analysis['SET'] = function (str) {
		return protect_split(',', str);
	};
	
	analysis['FROM'] = analysis['DELETE FROM'] = analysis['UPDATE'] = function (str) {
		return str.split(',');
	};
	
	analysis['LEFT JOIN'] = analysis['JOIN'] = analysis['INNER JOIN'] = function (str) {
		str = str.split('ON');
		var result = new Array();
		result['table'] = trim(str[0]);
		result['cond'] = trim(str[1]);				
		return result;
	};
	
	analysis['WHERE'] = function (str) {
		return trim(str);
	};
	
	analysis['ORDER BY'] = function (str) {
		str = str.split(',');
		var result = new Array();
		str.forEach(function (item, key) {
			var order_by = /([A-Za-z0-9_\.]+)\s+(ASC|DESC){1}/gi;
			order_by = order_by.exec(item);
			var tmp = new Array();
			tmp['column'] = trim(order_by[1]);
			tmp['order'] = trim(order_by[2]);
			result.push(tmp);
		});
		return result;
	};
	
	analysis['LIMIT'] = function (str) {
		var limit = /((\d+)\s*,\s*)?(\d+)/gi;
		limit = limit.exec(str);
		if (typeof limit[2] == 'undefined') limit[2] = 1;
		var result = new Array();
		result['nb'] = trim(limit[3]);
		result['from'] = trim(limit[2]);
		return result;
	};
	
	analysis['INSERT INTO'] = function (str) {
		var insert = /([A-Za-z0-9_\.]+)\s*\(([A-Za-z0-9_\., ]+)\)/gi;
		insert = insert.exec(str);
		var result = new Array();
		result['table'] = trim(insert[1]);
		result['columns'] = insert[2].split(',');
		result['columns'] = result['columns'].map(function (item) {
			return trim(item);
		});
		return result;
	};
	
	analysis['VALUES'] = function (str) {
		var values = /\(([A-Za-z0-9_\.,"' ]+)\)/gi;
		values = values.exec(str);
		var result = protect_split(',', values[1]);
		result = result.map(function (item) {
			return trim(item);
		});
		return result;
	};
	
	// Analyze parts
	var result = new Array();
	var j = 0;
	parts_order.forEach(function (item, key) {
		j++;
		if (typeof analysis[item] != 'undefined') {
			var part_result = analysis[item](parts[j]);
			
			if (typeof result[item] != 'undefined') {
				if (typeof result[item] == 'string' || typeof result[item][0] == 'undefined') {
					var tmp = result[item];
					result[item] = new Array();
					result[item].push(tmp);
				}
				
				result[item].push(part_result);
			}
			else result[item] = part_result;
		}
	});
	console.log(query);
	console.log(result);
	
	return output;
}