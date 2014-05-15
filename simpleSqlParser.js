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



	/********************************************************************************************
		LOW LEVEL PARSERS
	********************************************************************************************/

	// The name of a column/table
	var colName = alt(
		regex(/(?!(FROM|AS)\s)[a-z*][a-z0-9_]*/i),
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
		string('&'),
		string('~'),
		string('|'),
		string('^'),
		regex(/XOR/i),
		string('<=>'),
		string('='),
		string('!='),
		string('>'),
		string('>='),
		string('<'),
		string('<='),
		regex(/IS NULL/i),
		regex(/IS NOT/i),
		regex(/IS NOT NULL/i),
		regex(/IS/i),
		string('>>'),
		string('<<'),
		regex(/LIKE/i),
		regex(/NOT LIKE/i),
		string('%'),
		regex(/MOD/i),
		regex(/NOT/i),
		string('||'),
		regex(/OR/i),
		string('&&'),
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
					table: node[0],
					column: node[2]
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
					column: node
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
				n.alias = node[2];
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
				opt(regex(/AS/i)),
				optWhitespace,
				alt(colName, str),
				optWhitespace
			).map(function(node) {
				return node[3];
			}),
			null
		)
	).map(function(node) {
		var n = {};
		n.table = node[0];
		n.alias = node[1];
		return n;
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



	/********************************************************************************************
		MAIN PARSERS
	********************************************************************************************/

	// SELECT parser
	var p = seq(
		regex(/SELECT/i).skip(optWhitespace).then(opt(colList)),
		regex(/FROM/i).skip(optWhitespace).then(opt(tableList))
	).map(function(node) {
		return {
			type: 'select',
			select: node[0],
			from: node[1]
		};
	});



	/********************************************************************************************
		PUBLIC FUNCTIONS
	********************************************************************************************/

	exports.sql2ast = function(sql) {
		return p.parse(sql);
	};

})(typeof exports === "undefined" ? (this.simpleSqlParser = {}) : exports, typeof Parsimmon === 'object' ? Parsimmon : require('Parsimmon'));


/*var simpleSqlParser = require('./simpleSqlParser.js');


// Tests (will be rewritten/automatized/externalized)
var q = [
	'SELECT colname1 AS col1, colname2 "col2", "k\'ge\\"rg",`gfrg` , y, \'other string\' FROM table',
	'SELECT FROM table1, table2 AS t2',
	'SELECT * FROM table',
	'SELECT a, NOW(), TRUC("test\\" ", table.col , MACHIN(NOW())), b FROM table',
	'SELECT table.col FROM table',
	'SELECT (1+2) / MACHIN(6.6, 2, table.`col`) AS truc FROM'
];
q.forEach(function(query) {
	var ast = simpleSqlParser.sql2ast(query);
	if (ast.status) {
		console.log('--> ' + query);
		console.log(ast.value);
	}
	else console.log(ast);
	console.log();
});

*/
