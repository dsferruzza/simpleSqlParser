!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.simpleSqlParser=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (global){
"use strict";
var Parsimmon = (typeof window !== "undefined" ? window.Parsimmon : typeof global !== "undefined" ? global.Parsimmon : null);

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
	if (typeof empty == 'undefined') empty = [];
	return parser.or(string('').map(function(node) {
		return empty;
	}));
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
function removeQuotes(string) {
	return string.replace(/^([`'"])(.*)\1$/, '$2');
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
	opt(lazy(function() { return argList; })).map(mkString),
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
	regex(/OR/i),
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
				column: removeQuotes(node[2])
			};
		}),
		func.map(function(node) {
			return {
				expression: node,
				table: null,
				column: null
			};
		}),
		colName.map(function(node) {
			return {
				expression: node,
				table: null,
				column: removeQuotes(node)
			};
		}),
		str.map(function(node) {
			return {
				expression: node,
				table: null,
				column: null
			};
		}),
		number.map(function(node) {
			return {
				expression: node,
				table: null,
				column: null
			};
		}),
		list.map(function(node) {
			return {
				expression: node,
				table: null,
				column: null
			};
		})
	),
	opt(seq(
		optWhitespace,
		operator,
		opt(seq(
			optWhitespace,
			lazy(function() { return expression; }).map(function(node) {
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
			column: null
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
	n.expression = n.expression + ((node[1] !== null) ? node[1].expression : '');
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
		colName
	),
	opt(	// Alias
		seq(
			optWhitespace,
			opt(regex(/AS\s/i)),
			alt(colName, str)
		).map(function(node) {
			return {
				alias: removeQuotes(node[2]),
				expression : node.join(''),
			};
		}),
		null
	)
).map(function(node) {
	var n = {};
	n.table = node[0];
	n.alias = (node[1] !== null) ? node[1].alias : null;
	n.expression = node[0] + ((node[1] !== null) ? node[1].expression : '');
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
	tableListExpression,
	optWhitespace,
	regex(/ON/i),
	optWhitespace,
	expression
).map(function(node) {
	var n = {};
	n.type = node[0] || 'inner';
	n.table = node[3].table;
	n.alias = node[3].alias;
	n.condition = {
		expression: node[7].expression,
	};
	return n;
});

// Expression following a WHERE statement
var whereExpression = expression.map(function(node) {
	return {
		expression: node.expression
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
	if (node[1] === null) return {
		from: null,
		nb: parseInt(node[0], 10),
	};
	else return {
		from: parseInt(node[0], 10),
		nb: parseInt(node[1][3], 10),
	};
});

// Expression designating a column before VALUES in INSERT query
var insertColListExpression = alt(
	tableAndColumn.map(function(node) {
		return {
			expression: node.join(''),
			column: removeQuotes(node[2])
		};
	}),
	colName.map(function(node) {
		return {
			expression: node,
			column: removeQuotes(node)
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
var colList = optionnalList(colListExpression);

// List of table following a FROM statement
var tableList = optionnalList(tableListExpression);

// List of table following an GROUP BY statement
var groupList = optionnalList(expression);

// List of table following an ORDER BY statement
var orderList = optionnalList(orderListExpression);

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
	opt(regex(/GROUP BY/i).skip(optWhitespace).then(opt(groupList))),
	opt(regex(/ORDER BY/i).skip(optWhitespace).then(opt(orderList))),
	opt(regex(/LIMIT/i).skip(optWhitespace).then(opt(limitExpression)), null)
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

exports.sql2ast = function(sql) {
	return p.parse(sql);
};

exports.ast2sql = function(ast) {
	if (typeof ast === 'object' && ast.status === true) ast = ast.value;
	else return false;

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

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])
(1)
});