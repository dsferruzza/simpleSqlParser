(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.simpleSqlParser = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports.sql2ast = require('./src/sql2ast.js');
module.exports.ast2sql = require('./src/ast2sql.js');

},{"./src/ast2sql.js":2,"./src/sql2ast.js":3}],2:[function(require,module,exports){
'use strict';

module.exports = function(astObject) {
	/*if (typeof ast === 'object' && ast.status === true) ast = ast.value;
	else return false;*/
	if (typeof astObject !== 'object' || astObject.status !== true) return false;

	function select(ast) {
		var result = 'SELECT ';
		result += ast.select.map(function(item) {
			return item.expression;
		}).join(', ');
		return result;
	}

	function from(ast) {
		var result = 'FROM ';
		result += ast.from.map(function(item) {
			return item.expression;
		}).join(', ');
		return result;
	}

	function join(ast) {
		return ast.join.map(function(item) {
			var result = '';
			if (item.type === 'inner') result += 'INNER JOIN ';
			else if (item.type === 'left') result += 'LEFT JOIN ';
			else if (item.type === 'right') result += 'RIGHT JOIN ';
			else return '';
			result += item.table;
			if (item.alias !== null) result += ' AS ' + item.alias;
			result += ' ON ';
			result += item.condition.expression;
			return result;
		}).join(' ');
	}

	function where(ast) {
		var result = '';
		if (ast.where !== null) result += 'WHERE ' + ast.where.expression;
		return result;
	}

	function group(ast) {
		var result = '';
		if (ast.group.length > 0) {
			result += 'GROUP BY ';
			result += ast.group.map(function(item) {
				return item.expression;
			}).join(', ');
		}
		return result;
	}

	function order(ast) {
		var result = '';
		if (ast.order.length > 0) {
			result += 'ORDER BY ';
			result += ast.order.map(function(item) {
				return item.expression;
			}).join(', ');
		}
		return result;
	}

	function limit(ast) {
		var result = '';
		if (ast.limit !== null) {
			result += 'LIMIT ';
			if (ast.limit.from !== null) result += ast.limit.from + ', ';
			result += ast.limit.nb;
		}
		return result;
	}

	function into(ast) {
		return 'INSERT INTO ' + ast.into.expression;
	}

	function values(ast) {
		var result = '';
		var targets = ast.values.filter(function(item) {
			return item.target !== null;
		});
		if (targets.length > 0) {
			result += '(';
			result += targets.map(function(item) {
				return item.target.expression;
			}).join(', ');
			result += ') ';
		}
		result += 'VALUES (';
		result += ast.values.map(function(item) {
			return item.value;
		}).join(', ');
		result += ')';
		return result;
	}

	function table(ast) {
		return 'UPDATE ' + ast.table.expression;
	}

	function update(ast) {
		var result = 'SET ';
		result += ast.values.map(function(item) {
			return item.target.expression + ' = ' + item.value;
		}).join(', ');
		return result;
	}

	var ast = astObject.value;
	var parts = [];
	if (ast.type === 'select') {
		parts.push(select(ast));
		parts.push(from(ast));
		parts.push(join(ast));
		parts.push(where(ast));
		parts.push(group(ast));
		parts.push(order(ast));
		parts.push(limit(ast));
	}
	else if (ast.type === 'insert') {
		parts.push(into(ast));
		parts.push(values(ast));
	}
	else if (ast.type === 'update') {
		parts.push(table(ast));
		parts.push(update(ast));
		parts.push(where(ast));
	}
	else if (ast.type === 'delete') {
		parts.push('DELETE');
		parts.push(from(ast));
		parts.push(where(ast));
	}
	else return false;

	return parts.filter(function(item) {
		return item !== '';
	}).join(' ');
};

},{}],3:[function(require,module,exports){
(function (global){
'use strict';
var Parsimmon = (typeof window !== "undefined" ? window['parsimmon'] : typeof global !== "undefined" ? global['parsimmon'] : null);

/********************************************************************************************
	ALIASES
********************************************************************************************/

var seq = Parsimmon.seq;
var alt = Parsimmon.alt;
var regex = Parsimmon.regex;
var string = Parsimmon.string;
var optWhitespace = Parsimmon.optWhitespace;
var whitespace = Parsimmon.whitespace;
var lazy = Parsimmon.lazy;



/********************************************************************************************
	COMMON PATTERNS
********************************************************************************************/

// Make a parser optionnal
// "empty" parameter will be returned as result if the optionnal parser can't match
function opt(parser, empty) {
	if (typeof empty == 'undefined') return parser.or(Parsimmon.succeed([]));
	return parser.or(Parsimmon.succeed(empty));
}

// Join results of a parser
function mkString(node) {
	return node.join('');
}

// Add an item to an optionnal list and return the final list
function mergeOptionnalList(node) {
	node[0].push(node[1]);
	return node[0];
}

// Generate a parser that accept a comma-separated list of something
function optionnalList(parser) {
	return seq(
		parser.skip(optWhitespace).skip(string(',')).skip(optWhitespace).many(),
		parser.skip(optWhitespace)
	).map(mergeOptionnalList);
}

// Remove first and last character of a string
function removeQuotes(str) {
	return str.replace(/^([`'"])(.*)\1$/, '$2');
}

// Add the starting and ending char positions of matches of a given parser
function getPos(parser) {
	return seq(
		Parsimmon.index,
		parser,
		Parsimmon.index
	).map(function(node) {
		var pos = {
			start: node[0],
			end: node[2],
		};
		if (typeof node[1] == 'object') {
			var n = node[1];
			n.position = pos;
			return n;
		}
		else {
			pos.out = node[1];
			return pos;
		}
	});
}



/********************************************************************************************
	LOW LEVEL PARSERS
********************************************************************************************/

// The name of a column/table
var colName = alt(
	regex(/(?!(FROM|WHERE|GROUP BY|ORDER BY|LIMIT|INNER|LEFT|RIGHT|JOIN|ON|VALUES|SET)\s)[a-z*][a-z0-9_]*/i),
	regex(/`[^`\\]*(?:\\.[^`\\]*)*`/)
);

// A string
var str = alt(
	regex(/"[^"\\]*(?:\\.[^"\\]*)*"/),
	regex(/'[^'\\]*(?:\\.[^'\\]*)*'/)
);

// A function expression
var func = seq(
	alt(
		regex(/[a-zA-Z0-9_]+\(/),
		string('(')
		),
	/*eslint-disable no-use-before-define*/
	opt(lazy(function() {
		return argList;
	})).map(mkString),
	/*eslint-enable no-use-before-define*/
	string(')')
).map(mkString);

// A table.column expression
var tableAndColumn = seq(
	colName,
	string('.'),
	colName
);

// An operator
var operator = alt(
	string('+'),
	string('-'),
	string('*'),
	string('/'),
	string('&&'),
	string('&'),
	string('~'),
	string('||'),
	string('|'),
	string('^'),
	regex(/XOR/i),
	string('<=>'),
	string('='),
	string('!='),
	string('>='),
	string('>>'),
	string('>'),
	string('<='),
	string('<<'),
	string('<'),
	regex(/IS NULL/i),
	regex(/IS NOT/i),
	regex(/IS NOT NULL/i),
	regex(/IS/i),
	regex(/LIKE/i),
	regex(/NOT LIKE/i),
	string('%'),
	regex(/MOD/i),
	regex(/NOT/i),
	regex(/OR\s/i),	// A space is forced after so this doesn't get mixed up with ORDER BY
	regex(/AND/i),
	regex(/IN/i)
);

// A number
var number = regex(/[-]?\d+\.?\d*/);



/********************************************************************************************
	EXPRESSION PARSERS
********************************************************************************************/

// List (following IN, for example)
var list = seq(
	string('('),
	optWhitespace,
	seq(
		alt(
			number,
			str
		),
		optWhitespace,
		opt(string(',')),
		optWhitespace,
		opt(
			alt(
				number,
				str
			)
		)
	).map(mkString),
	optWhitespace,
	string(')')
).map(mkString);

// Expression
var expression = seq(
	alt(
		tableAndColumn.map(function(node) {
			return {
				expression: node.join(''),
				table: removeQuotes(node[0]),
				column: removeQuotes(node[2]),
			};
		}),
		func.map(function(node) {
			return {
				expression: node,
				table: null,
				column: null,
			};
		}),
		colName.map(function(node) {
			return {
				expression: node,
				table: null,
				column: removeQuotes(node),
			};
		}),
		str.map(function(node) {
			return {
				expression: node,
				table: null,
				column: null,
			};
		}),
		number.map(function(node) {
			return {
				expression: node,
				table: null,
				column: null,
			};
		}),
		list.map(function(node) {
			return {
				expression: node,
				table: null,
				column: null,
			};
		})
	),
	opt(seq(
		optWhitespace,
		operator,
		opt(seq(
			optWhitespace,
			lazy(function() {
				return expression;
			}).map(function(node) {
				return node.expression;
			})
		).map(mkString), null)
	).map(mkString), null)
).map(function(node) {
	if (node[1] !== null) {
		node[0] = node[0].expression;
		return {
			expression: node.join(''),
			table: null,
			column: null,
		};
	}
	else return node[0];
});

// Expression following a SELECT statement
var colListExpression = seq(
	expression,
	opt(	// Alias
		seq(
			optWhitespace,
			opt(regex(/AS\s/i)),
			alt(colName, str)
		).map(function(node) {
			var n = {};
			n.alias = removeQuotes(node[2]);
			n.expression = node.join('');
			return n;
		}),
		null
	)
).map(function(node) {
	var n = node[0];
	n.alias = (node[1] !== null) ? node[1].alias : null;
	n.expression += ((node[1] !== null) ? node[1].expression : '');
	return n;
});

// Expression inside a function
var argListExpression = expression.map(function(node) {
	return node.expression;
});

// Expression following a FROM statement
var tableListExpression = seq(
	alt(
		tableAndColumn.map(mkString),
		colName,
		regex(/"([^"\\]*(?:\\.[^"\\]*)*)"/, 1).map(function(node) {
			return {
				table: node,
				expression: '"' + node + '"',
			};
		})
	),
	opt(	// Alias
		seq(
			optWhitespace,
			opt(regex(/AS\s/i)),
			alt(colName, str)
		).map(function(node) {
			return {
				alias: removeQuotes(node[2]),
				expression: node.join(''),
			};
		}),
		null
	)
).map(function(node) {
	var n = {};
	if (typeof node[0] === 'object') {
		n.table = node[0].table;
		n.expression = node[0].expression;
	}
	else {
		n.table = node[0];
		n.expression = node[0] + ((node[1] !== null) ? node[1].expression : '');
	}
	n.alias = (node[1] !== null) ? node[1].alias : null;
	return n;
});

// JOIN expression (including JOIN statements)
var joinExpression = seq(
	opt(seq(
		regex(/INNER|LEFT|RIGHT/i),
		whitespace
	).map(function(node) {
		return node[0].toLowerCase();
	}), null),
	regex(/JOIN/i),
	optWhitespace,
	getPos(tableListExpression),
	optWhitespace,
	regex(/ON/i),
	optWhitespace,
	getPos(expression)
).map(function(node) {
	var n = {};
	n.type = node[0] || 'inner';
	n.table = node[3].table;
	n.alias = node[3].alias;
	n.position = node[3].position;
	n.condition = {
		expression: node[7].expression,
		position: node[7].position,
	};
	return n;
});

// Expression following a WHERE statement
var whereExpression = getPos(expression).map(function(node) {
	return {
		expression: node.expression,
		position: node.position,
	};
});

// Expression following an ORDER BY statement
var orderListExpression = seq(
	expression,
	opt(seq(
		optWhitespace,
		regex(/ASC|DESC/i)
	), null)
).map(function(node) {
	return {
		expression: node[0].expression + ((node[1] !== null) ? node[1].join('') : ''),
		order: (node[1] !== null) ? node[1][1] : 'ASC',
		table: node[0].table,
		column: node[0].column,
	};
});

// Expression following a LIMIT statement
var limitExpression = seq(
	number,
	opt(seq(
		optWhitespace,
		string(','),
		optWhitespace,
		number
	), null)
).map(function(node) {
	if (node[1] === null) {
		return {
			from: null,
			nb: parseInt(node[0], 10),
		};
	}
	else {
		return {
			from: parseInt(node[0], 10),
			nb: parseInt(node[1][3], 10),
		};
	}
});

// Expression designating a column before VALUES in INSERT query
var insertColListExpression = alt(
	tableAndColumn.map(function(node) {
		return {
			expression: node.join(''),
			column: removeQuotes(node[2]),
		};
	}),
	colName.map(function(node) {
		return {
			expression: node,
			column: removeQuotes(node),
		};
	})
);

// Expression following a VALUES statement
var valueExpression = expression.map(function(node) {
	return node.expression;
});

// Expression that assign a value to a column
var assignExpression = seq(
	insertColListExpression,
	optWhitespace,
	string('='),
	optWhitespace,
	expression
).map(function(node) {
	return {
		target: node[0],
		value: node[4].expression,
	};
});



/********************************************************************************************
	HIGH LEVEL PARSERS
********************************************************************************************/

// List of arguments inside a function
var argList = seq(
	seq(argListExpression, optWhitespace, string(','), optWhitespace).map(mkString).many(),
	argListExpression.skip(optWhitespace)
).map(mergeOptionnalList);

// List of expressions following a SELECT statement
var colList = optionnalList(getPos(colListExpression));

// List of table following a FROM statement
var tableList = optionnalList(getPos(tableListExpression));

// List of table following an GROUP BY statement
var groupList = optionnalList(getPos(expression));

// List of table following an ORDER BY statement
var orderList = optionnalList(getPos(orderListExpression));

// List of joins (including JOIN statements)
var joinList = optWhitespace.then(joinExpression).skip(optWhitespace).many();

// List of columns before VALUES in INSERT query
var insertColList = optionnalList(insertColListExpression);

// List of values following a VALUES statement
var valuesList = optionnalList(valueExpression);

// List of assign expression following a SET statement
var assignList = optionnalList(assignExpression);



/********************************************************************************************
	MAIN PARSERS
********************************************************************************************/

// SELECT parser
var selectParser = seq(
	regex(/SELECT/i).skip(optWhitespace).then(opt(colList)),
	regex(/FROM/i).skip(optWhitespace).then(opt(tableList)),
	opt(joinList),
	opt(regex(/WHERE/i).skip(optWhitespace).then(opt(whereExpression)), null),
	opt(regex(/\s?GROUP BY/i).skip(optWhitespace).then(opt(groupList))),
	opt(regex(/\s?ORDER BY/i).skip(optWhitespace).then(opt(orderList))),
	opt(regex(/\s?LIMIT/i).skip(optWhitespace).then(opt(limitExpression)), null)
).map(function(node) {
	return {
		type: 'select',
		select: node[0],
		from: node[1],
		join: node[2],
		where: node[3],
		group: node[4],
		order: node[5],
		limit: node[6],
	};
});

// INSERT parser
var insertParser = seq(
	regex(/INSERT INTO/i).skip(optWhitespace).then(tableListExpression),
	optWhitespace,
	opt(
		seq(
			string('('),
			insertColList,
			string(')')
		).map(function(node) {
			return node[1];
		})
	),
	optWhitespace,
	regex(/VALUES\s?\(/i).skip(optWhitespace).then(valuesList),
	string(')')
).map(function(node) {
	var values = [];
	var bigger = Math.max(node[2].length, node[4].length);

	for (var i = 0; i < bigger; ++i) {
		values[i] = {
			target: node[2][i] || null,
			value: node[4][i] || null,
		};
	}

	return {
		type: 'insert',
		into: node[0],
		values: values,
	};
});

// UPDATE parser
var updateParser = seq(
	regex(/UPDATE/i).skip(optWhitespace).then(tableListExpression),
	optWhitespace,
	regex(/SET/i).skip(optWhitespace).then(assignList),
	optWhitespace,
	opt(regex(/WHERE/i).skip(optWhitespace).then(opt(whereExpression)), null)
).map(function(node) {
	return {
		type: 'update',
		table: node[0],
		values: node[2],
		where: node[4],
	};
});

// DELETE parser
var deleteParser = seq(
	regex(/DELETE FROM/i).skip(optWhitespace).then(opt(tableList)),
	opt(regex(/WHERE/i).skip(optWhitespace).then(opt(whereExpression)), null)
).map(function(node) {
	return {
		type: 'delete',
		from: node[0],
		where: node[1],
	};
});

// Main parser
var p = alt(selectParser, insertParser, updateParser, deleteParser);



/********************************************************************************************
	PUBLIC FUNCTIONS
********************************************************************************************/

module.exports = function(sql) {
	var result = p.parse(sql);
	if (result.status === false) result.error = Parsimmon.formatError(sql, result);
	return result;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});