function trim(str) {
	if (typeof str == 'string') return str.replace(/^\s+/g,'').replace(/\s+$/g,'');
	else return str;
}
// TODO: use Mootools trim() ?

// Split a string using a separator, only if this separator isn't beetween brackets
function protect_split(separator, str) {
	var sep = '######';
	
	var string = false;
	var nb_brackets = 0;
	var new_str = "";
	for (var i = 0 ; i < str.length ; i++) {
		if (!string && /['"`]/.test(str[i])) string = str[i];
		else if (string && str[i] == string) string = false;
		else if (!string && str[i] == '(') nb_brackets ++;
		else if (!string && str[i] == ')') nb_brackets --;
		
		if (str[i] == ',' && (nb_brackets > 0 || string)) new_str += sep;
		else new_str += str[i];
	}
	str = new_str;
	
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
	parts_name = parts_name.concat(parts_name.map(function (item) {
		return item.toLowerCase();
	}));
	var parts_order = new Array();
	
	// Hide words defined as separator but written inside brackets in the query
	query = query.replace(/\((.+?)\)|"(.+?)"|'(.+?)'|`(.+?)`/gi, function (match) {
		return match.replace(new RegExp(parts_name.join('|'), 'gi'), protect);
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
	parts_order.forEach(function (item, key) {
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
	
	// Split parts
	var parts = query.split(new RegExp(parts_name.join('|'), 'i'));
	
	// Unhide words precedently hidden with protect()
	query = query.replace(/\((.+?)\)|"(.+?)"|'(.+?)'|`(.+?)`/gi, function (match) {
		return match.replace(new RegExp(words, 'gi'), unprotect);
	});
	parts = parts.map(function (item) {
		return item.replace(/\((.+?)\)|"(.+?)"|'(.+?)'|`(.+?)`/gi, function (match) {
			return match.replace(new RegExp(words, 'gi'), unprotect);
		});
	});
	
	// Define analysis functions
	var analysis = new Array();
	
	analysis['SELECT'] = analysis['SET'] = function (str) {
		var result = protect_split(',', str);
		result.forEach(function(item, key) {
			if (item == '') result.splice(key);
		});
		return result;
	};
	
	analysis['FROM'] = analysis['DELETE FROM'] = analysis['UPDATE'] = function (str) {
		var result = str.split(',');
		result = result.map(function(item) {
			return trim(item);
		});
		result.forEach(function(item, key) {
			if (item == '') result.splice(key);
		});
		return result;
	};
	
	analysis['LEFT JOIN'] = analysis['JOIN'] = analysis['INNER JOIN'] = function (str) {
		str = str.split(' ON ');
		var result = new Object();
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
			if (order_by != null) {
				var tmp = new Object();
				tmp['column'] = trim(order_by[1]);
				tmp['order'] = trim(order_by[2]);
				result.push(tmp);
			}
		});
		return result;
	};
	
	analysis['LIMIT'] = function (str) {
		var limit = /((\d+)\s*,\s*)?(\d+)/gi;
		limit = limit.exec(str);
		if (typeof limit[2] == 'undefined') limit[2] = 1;
		var result = new Object();
		result['nb'] = parseInt(trim(limit[3]));
		result['from'] = parseInt(trim(limit[2]));
		return result;
	};
	
	analysis['INSERT INTO'] = function (str) {
		var insert = /([A-Za-z0-9_\.]+)\s*(\(([A-Za-z0-9_\., ]+)\))?/gi;
		insert = insert.exec(str);
		var result = new Object();
		result['table'] = trim(insert[1]);
		if (typeof insert[3] != 'undefined') {
			result['columns'] = insert[3].split(',');
			result['columns'] = result['columns'].map(function (item) {
				return trim(item);
			});
		}
		return result;
	};
	
	analysis['VALUES'] = function (str) {
		var groups = protect_split(',', str);
		var result = new Array();
		groups.forEach(function(group) {
			var group = group.replace(/^\(/g,'').replace(/\)$/g,'');
			group = protect_split(',', group);
			result.push(group);
		});
		return result;
	};
	
	// Analyze parts
	var result = new Object();
	var j = 0;
	parts_order.forEach(function (item, key) {
		item = item.toUpperCase();
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

	// Parse conditions
	if (typeof result['WHERE'] == 'string') {
		result['WHERE'] = CondParser.parse(result['WHERE']);
	}
	if (typeof result['LEFT JOIN'] != 'undefined') {
		if (typeof result['LEFT JOIN']['cond'] != 'undefined') {
			result['LEFT JOIN']['cond'] = CondParser.parse(result['LEFT JOIN']['cond']);
		}
		else {
			result['LEFT JOIN'].forEach(function (item, key) {
				result['LEFT JOIN'][key]['cond'] = CondParser.parse(item['cond']);
			});
		}
	}
	if (typeof result['INNER JOIN'] != 'undefined') {
		if (typeof result['INNER JOIN']['cond'] != 'undefined') {
			result['INNER JOIN']['cond'] = CondParser.parse(result['INNER JOIN']['cond']);
		}
		else {
			result['INNER JOIN'].forEach(function (item, key) {
				result['INNER JOIN'][key]['cond'] = CondParser.parse(item['cond']);
			});
		}
	}

	return result;
}


/*
 * LEXER & PARSER FOR SQL CONDITIONS
 * Inspired by https://github.com/DmitrySoshnikov/Essentials-of-interpretation
 */

// Constructor
function CondLexer(source) {
	this.source = source;
	this.cursor = 0;
	this.currentChar = "";

	this.readNextChar();
}

CondLexer.prototype = {
	constructor: CondLexer,
	
	// Read the next character (or return an empty string if cursor is at the end of the source)
	readNextChar: function () {
		this.currentChar = this.source[this.cursor++] || "";
	},

	// Determine the next token
	readNextToken: function () {
		if (/\w/.test(this.currentChar)) return this.readWord();
		if (/["'`]/.test(this.currentChar)) return this.readString();
		if (/[()]/.test(this.currentChar)) return this.readGroupSymbol();
		if (/[!=<>]/.test(this.currentChar)) return this.readOperator();
		
		if (this.currentChar == "") return {type: 'eot', value: ''};
		else {
			this.readNextChar();
			return {type: 'empty', value: ''};
		}
	},
	
	readWord: function () {
		var tokenValue = "";
		var nb_brackets = 0;
		var string = false;
		while (/./.test(this.currentChar)) {
			// Check if we are in a string
			if (!string && /['"`]/.test(this.currentChar)) string = this.currentChar;
			else if (string && this.currentChar == string) string = false;
			else {
				// Allow spaces inside functions (only if we are not in a string)
				if (!string) {
					// Token is finished if there is a closing bracket outside a string and with no opening
					if (this.currentChar == ')' && nb_brackets <= 0) break;

					if (this.currentChar == '(') nb_brackets++;
					else if (this.currentChar == ')') nb_brackets--;

					// Token is finished if there is a operator symbol outside a string
					if (/[!=<>]/.test(this.currentChar)) break;
				}

				// Token is finished on the first space which is outside a string or a function
				if (this.currentChar == ' ' && nb_brackets <= 0) break;
			}

			tokenValue += this.currentChar;
			this.readNextChar();
		}
		
		if (/^(AND|OR)$/i.test(tokenValue)) return {type: 'logic', value: tokenValue};
		if (/^(IS|NOT)$/i.test(tokenValue)) return {type: 'operator', value: tokenValue};
		else return {type: 'word', value: tokenValue};
	},
	
	readString: function () {
		var tokenValue = "";
		var quote = this.currentChar;
		
		tokenValue += this.currentChar;
		this.readNextChar();

		while (this.currentChar != quote) {
			tokenValue += this.currentChar;
			this.readNextChar();
		}

		tokenValue += this.currentChar;
		this.readNextChar();
		
		// Handle this case : `table`.`column`
		if (this.currentChar == '.') {
			tokenValue += this.currentChar;
			this.readNextChar();
			tokenValue += this.readString().value;
			
			return {type: 'word', value: tokenValue};
		}
		
		return {type: 'string', value: tokenValue};
	},
	
	readGroupSymbol: function () {
		var tokenValue = this.currentChar;
		this.readNextChar();

		return {type: 'group', value: tokenValue};
	},
	
	readOperator: function () {
		var tokenValue = this.currentChar;
		this.readNextChar();
		
		if (/[=<>]/.test(this.currentChar)) {
			tokenValue += this.currentChar;
			this.readNextChar();
		}
		
		return {type: 'operator', value: tokenValue};
	},
};

// Tokenise a string (only useful for debug)
CondLexer.tokenize = function (source) {
	var lexer = new CondLexer(source);
	var tokens = [];
	do {
		var token = lexer.readNextToken();
		if (token.type != 'empty') tokens.push(token);
	}
	while (lexer.currentChar);
	return tokens;
};


// Constructor
function CondParser(source) {
	this.lexer = new CondLexer(source);
	this.currentToken = "";

	this.readNextToken();
}

CondParser.prototype = {
	constructor: CondParser,
	
	// Read the next token (skip empty tokens)
	readNextToken: function () {
		this.currentToken = this.lexer.readNextToken();
		while (this.currentToken.type == 'empty') this.currentToken = this.lexer.readNextToken();
		return this.currentToken;
	},

	// Wrapper function ; parse the source
	parseExpressionsRecursively: function () {
		return this.parseLogicalExpression();
	},
	
	// Parse logical expressions (AND/OR)
	parseLogicalExpression: function () {
		var leftNode = this.parseConditionExpression();
		
		while (this.currentToken.type == 'logic') {
			var logic = this.currentToken.value;
			this.readNextToken();
			
			var rightNode = this.parseConditionExpression();
			
			// If we are chaining the same logical operator, add nodes to existing object instead of creating another one
			if (typeof leftNode.logic != 'undefined' && leftNode.logic == logic && typeof leftNode.terms != 'undefined') leftNode.terms.push(rightNode);
			else {
				var terms = [leftNode, rightNode];
				leftNode = {'logic': logic, 'terms': terms.slice(0)};
			}
		}

		return leftNode;
	},
	
	// Parse conditions ([word/string] [operator] [word/string])
	parseConditionExpression: function () {
		var leftNode = this.parseBaseExpression();
		
		if (this.currentToken.type == 'operator') {
			var operator = this.currentToken.value;
			this.readNextToken();
			
			// If there are 2 adjacent operators, join them with a space (exemple: IS NOT)
			if (this.currentToken.type == 'operator') {
				operator += ' ' + this.currentToken.value;
				this.readNextToken();
			}
			
			var rightNode = this.parseBaseExpression();
			
			leftNode = {'operator': operator, 'left': leftNode, 'right': rightNode};
		}

		return leftNode;
	},
	
	// Parse base items
	parseBaseExpression: function () {
		var astNode = "";
		
		// If this is a word/string, return its value
		if (this.currentToken.type == 'word' || this.currentToken.type == 'string') {
			astNode = this.currentToken.value;
			this.readNextToken();
		}
		// If this is a group, skip brackets and parse the inside
		else if (this.currentToken.type == 'group') {
			this.readNextToken();
			astNode = this.parseExpressionsRecursively();
			this.readNextToken();
		}

		return astNode;
	},
};

// Parse a string
CondParser.parse = function (source) {
	return new CondParser(source).parseExpressionsRecursively();
}
