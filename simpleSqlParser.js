(function(exports, Parsimmon) {
	"use strict";

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
		regex(/(?!(FROM|WHERE|ORDER BY|LIMIT|INNER|LEFT|RIGHT|JOIN|ON)\s)[a-z*][a-z0-9_]*/i),
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
		regex(/AND/i)
	);

	// A number
	var number = regex(/[-]?\d+\.?\d*/);



	/********************************************************************************************
		EXPRESSION PARSERS
	********************************************************************************************/

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
				return removeQuotes(node[2]);
			}),
			null
		)
	).map(function(node) {
		var n = {};
		n.table = node[0];
		n.alias = node[1];
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

	// List of table following an ORDER BY statement
	var orderList = optionnalList(orderListExpression);

	// List of joins (including JOIN statements)
	var joinList = optWhitespace.then(joinExpression).skip(optWhitespace).many();



	/********************************************************************************************
		MAIN PARSERS
	********************************************************************************************/

	// SELECT parser
	var selectParser = seq(
		regex(/SELECT/i).skip(optWhitespace).then(opt(colList)),
		regex(/FROM/i).skip(optWhitespace).then(opt(tableList)),
		opt(joinList),
		opt(regex(/WHERE/i).skip(optWhitespace).then(opt(whereExpression)), null),
		opt(regex(/ORDER BY/i).skip(optWhitespace).then(opt(orderList))),
		opt(regex(/LIMIT/i).skip(optWhitespace).then(opt(limitExpression)), null)
	).map(function(node) {
		return {
			type: 'select',
			select: node[0],
			from: node[1],
			join: node[2],
			where: node[3],
			order: node[4],
			limit: node[5],
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
	var p = alt(selectParser, deleteParser);



	/********************************************************************************************
		PUBLIC FUNCTIONS
	********************************************************************************************/

	exports.sql2ast = function(sql) {
		return p.parse(sql);
	};

})(typeof exports === "undefined" ? (this.simpleSqlParser = {}) : exports, typeof Parsimmon === 'object' ? Parsimmon : require('Parsimmon'));
