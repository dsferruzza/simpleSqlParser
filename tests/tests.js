(function () {
	"use strict";

	var m = simpleSqlParser;

	function ok(ast) {
		return {
			status: true,
			value: ast
		};
	}

	function testAst(comment, query, ast) {
		deepEqual(m.sql2ast(query), ok(ast), comment + ': ' + query);
	}

	function isArray(variable, message) {
		strictEqual(typeof variable, "object", message);
		strictEqual(Array.isArray(variable), true, message);
	}

	function isObject(variable, message) {
		strictEqual(typeof variable, "object", message);
		strictEqual(Array.isArray(variable), false, message);
	}

	test('sql2ast - API', function() {

		var q = [
			'SELECT * FROM table',
			'DELETE FROM table'
		];
		var ast = q.map(m.sql2ast);

		var types = ['select', 'delete'];

		ast.forEach(function(a) {
			strictEqual(a.status, true, "Parser must parse valid SQL");
			notStrictEqual(types.indexOf(a.value.type), -1, "AST must contain a valid type");

			if (a.value.type === types[0]) {
				isArray(a.value.select, "(SELECT) AST must contain a 'select' array");
				isArray(a.value.from, "(SELECT) AST must contain a 'from' array");
				isArray(a.value.join, "(SELECT) AST must contain a 'join' array");
				isObject(a.value.where, "(SELECT) AST must contain a 'where' object");
				isArray(a.value.order, "(SELECT) AST must contain a 'order' array");
				isObject(a.value.limit, "(SELECT) AST must contain a 'limit' object");
			}
			else if (a.value.type === types[0]) {
				isArray(a.value.from, "(DELETE) AST must contain a 'from' array");
				isObject(a.value.where, "(DELETE) AST must contain a 'where' object");
			}
		});

	});

	test('sql2ast - select', function() {

		testAst('Simple select', 'SELECT * FROM table', {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: null,
			order: [],
			limit: null,
		});

		testAst('Column quotes', 'SELECT col1, `col2` FROM table', {
			type: 'select',
			select: [
				{ expression: 'col1', column: 'col1', table: null, alias: null },
				{ expression: '`col2`', column: 'col2', table: null, alias: null },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: null,
			order: [],
			limit: null,
		});

		testAst('Special words', 'SELECT fromage "from", asymetric AS as FROM table', {
			type: 'select',
			select: [
				{ expression: 'fromage "from"', column: 'fromage', table: null, alias: 'from' },
				{ expression: 'asymetric AS as', column: 'asymetric', table: null, alias: 'as' },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: null,
			order: [],
			limit: null,
		});

		testAst('"table.column" notation', 'SELECT table.col1, table.`col2`, `table`.col3, `table`.`col4` FROM table', {
			type: 'select',
			select: [
				{ expression: 'table.col1', column: 'col1', table: 'table', alias: null },
				{ expression: 'table.`col2`', column: 'col2', table: 'table', alias: null },
				{ expression: '`table`.col3', column: 'col3', table: 'table', alias: null },
				{ expression: '`table`.`col4`', column: 'col4', table: 'table', alias: null },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: null,
			order: [],
			limit: null,
		});

		testAst('Strings', 'SELECT "string", "\\"special\\" string" FROM table', {
			type: 'select',
			select: [
				{ expression: '"string"', column: null, table: null, alias: null },
				{ expression: '"\\"special\\" string"', column: null, table: null, alias: null },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: null,
			order: [],
			limit: null,
		});

		testAst('Column alias #1', 'SELECT col1 AS alias, col2 AS "alias" FROM table', {
			type: 'select',
			select: [
				{ expression: 'col1 AS alias', column: 'col1', table: null, alias: 'alias' },
				{ expression: 'col2 AS "alias"', column: 'col2', table: null, alias: 'alias' },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: null,
			order: [],
			limit: null,
		});

		testAst('Column alias #2', 'SELECT col1 alias, col2 "alias" FROM table', {
			type: 'select',
			select: [
				{ expression: 'col1 alias', column: 'col1', table: null, alias: 'alias' },
				{ expression: 'col2 "alias"', column: 'col2', table: null, alias: 'alias' },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: null,
			order: [],
			limit: null,
		});

		testAst('Mathematical expressions', 'SELECT 1 + 1, col1*0.7 AS test FROM table', {
			type: 'select',
			select: [
				{ expression: '1 + 1', column: null, table: null, alias: null },
				{ expression: 'col1*0.7 AS test', column: null, table: null, alias: 'test' },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: null,
			order: [],
			limit: null,
		});

		testAst('Functions', 'SELECT FUNC(), OTHERFUN(col, FUNC(1/4, -3.05), "string") FROM table', {
			type: 'select',
			select: [
				{ expression: 'FUNC()', column: null, table: null, alias: null },
				{ expression: 'OTHERFUN(col, FUNC(1/4, -3.05), "string")', column: null, table: null, alias: null },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: null,
			order: [],
			limit: null,
		});

		testAst('Table alias', 'SELECT * FROM table AS t, table2 AS "t2"', {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null },
			],
			from: [
				{ table: 'table', alias: 't' },
				{ table: 'table2', alias: 't2' },
			],
			join: [],
			where: null,
			order: [],
			limit: null,
		});

		testAst('Where #1', 'SELECT * FROM table WHERE this >= that AND col IS NOT NULL', {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: {
				expression: "this >= that AND col IS NOT NULL",
			},
			order: [],
			limit: null,
		});

		testAst('Where #2', 'SELECT * FROM table WHERE (FUNC(this) = "string") AND (1+5 OR col1)', {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: {
				expression: "(FUNC(this) = \"string\") AND (1+5 OR col1)",
			},
			order: [],
			limit: null,
		});

		testAst('Order by', 'SELECT * FROM table ORDER BY table.col1, col2 DESC, FUNC(col3 + 7) ASC', {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: null,
			order: [
				{ expression: "table.col1", table: "table", column: "col1", order: "ASC" },
				{ expression: "col2 DESC", table: null, column: "col2", order: "DESC" },
				{ expression: "FUNC(col3 + 7) ASC", table: null, column: null, order: "ASC" },
			],
			limit: null,
		});

		testAst('Limit #1', 'SELECT * FROM table LIMIT 5', {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: null,
			order: [],
			limit: { from: null, nb: 5 },
		});

		testAst('Limit #2', 'SELECT * FROM table LIMIT 1, 2', {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null },
			],
			from: [
				{ table: 'table', alias: null },
			],
			join: [],
			where: null,
			order: [],
			limit: { from: 1, nb: 2 },
		});

	});

	test('sql2ast - delete', function() {

		testAst('Simple delete', 'DELETE FROM table', {
			type: 'delete',
			from: [
				{ table: 'table', alias: null },
			],
			where: null,
		});

		testAst('Several tables with aliases', 'DELETE FROM table1 AS t1, table2 "t2"', {
			type: 'delete',
			from: [
				{ table: 'table1', alias: 't1' },
				{ table: 'table2', alias: 't2' },
			],
			where: null,
		});

		testAst('Where #1', 'DELETE FROM table WHERE this >= that AND col IS NOT NULL', {
			type: 'delete',
			from: [
				{ table: 'table', alias: null },
			],
			where: {
				expression: "this >= that AND col IS NOT NULL",
			},
		});

		testAst('Where #2', 'DELETE FROM table WHERE (FUNC(this) = "string") AND (1+5 OR col1)', {
			type: 'delete',
			from: [
				{ table: 'table', alias: null },
			],
			where: {
				expression: "(FUNC(this) = \"string\") AND (1+5 OR col1)",
			},
		});

	});

})();
