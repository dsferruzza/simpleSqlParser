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

	function testBackAndForth(comment, query) {
		deepEqual(m.ast2sql(m.sql2ast(query)), query, comment + ': ' + query);
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
			'INSERT INTO table VALUES (1, 2, 3)',
			'UPDATE table SET col = "value"',
			'DELETE FROM table',
		];
		var ast = q.map(m.sql2ast);

		var types = ['select', 'delete', 'insert', 'update'];

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
			else if (a.value.type === types[1]) {
				isArray(a.value.from, "(DELETE) AST must contain a 'from' array");
				isObject(a.value.where, "(DELETE) AST must contain a 'where' object");
			}
			else if (a.value.type === types[2]) {
				isObject(a.value.into, "(INSERT) AST must contain a 'into' object");
				isArray(a.value.values, "(INSERT) AST must contain a 'values' array");
			}
			else if (a.value.type === types[3]) {
				isObject(a.value.table, "(UPDATE) AST must contain a 'table' object");
				isArray(a.value.values, "(UPDATE) AST must contain a 'values' array");
				isObject(a.value.where, "(UPDATE) AST must contain a 'where' object");
			}
		});

	});

	var Select = [
		{
			c: 'Simple select',
			q: 'SELECT * FROM table',
			a: {
				type: 'select',
				select: [
					{ expression: '*', column: '*', table: null, alias: null },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: null,
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Column quotes',
			q: 'SELECT col1, `col2` FROM table',
			a: {
				type: 'select',
				select: [
					{ expression: 'col1', column: 'col1', table: null, alias: null },
					{ expression: '`col2`', column: 'col2', table: null, alias: null },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: null,
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Special words',
			q: 'SELECT fromage "from", asymetric AS as FROM table',
			a: {
				type: 'select',
				select: [
					{ expression: 'fromage "from"', column: 'fromage', table: null, alias: 'from' },
					{ expression: 'asymetric AS as', column: 'asymetric', table: null, alias: 'as' },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: null,
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: '"table.column" notation',
			q: 'SELECT table.col1, table.`col2`, `table`.col3, `table`.`col4` FROM table',
			a: {
				type: 'select',
				select: [
					{ expression: 'table.col1', column: 'col1', table: 'table', alias: null },
					{ expression: 'table.`col2`', column: 'col2', table: 'table', alias: null },
					{ expression: '`table`.col3', column: 'col3', table: 'table', alias: null },
					{ expression: '`table`.`col4`', column: 'col4', table: 'table', alias: null },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: null,
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Strings',
			q: 'SELECT "string", "\\"special\\" string" FROM table',
			a: {
				type: 'select',
				select: [
					{ expression: '"string"', column: null, table: null, alias: null },
					{ expression: '"\\"special\\" string"', column: null, table: null, alias: null },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: null,
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Column alias #1',
			q: 'SELECT col1 AS alias, col2 AS "alias" FROM table',
			a: {
				type: 'select',
				select: [
					{ expression: 'col1 AS alias', column: 'col1', table: null, alias: 'alias' },
					{ expression: 'col2 AS "alias"', column: 'col2', table: null, alias: 'alias' },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: null,
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Column alias #2',
			q: 'SELECT col1 alias, col2 "alias" FROM table',
			a: {
				type: 'select',
				select: [
					{ expression: 'col1 alias', column: 'col1', table: null, alias: 'alias' },
					{ expression: 'col2 "alias"', column: 'col2', table: null, alias: 'alias' },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: null,
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Mathematical expressions',
			q: 'SELECT 1 + 1, col1*0.7 AS test FROM table',
			a: {
				type: 'select',
				select: [
					{ expression: '1 + 1', column: null, table: null, alias: null },
					{ expression: 'col1*0.7 AS test', column: null, table: null, alias: 'test' },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: null,
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Functions',
			q: 'SELECT FUNC(), OTHERFUN(col, FUNC(1/4, -3.05), "string") FROM table',
			a: {
				type: 'select',
				select: [
					{ expression: 'FUNC()', column: null, table: null, alias: null },
					{ expression: 'OTHERFUN(col, FUNC(1/4, -3.05), "string")', column: null, table: null, alias: null },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: null,
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Table alias',
			q: 'SELECT * FROM table AS t, table2 AS "t2"',
			a: {
				type: 'select',
				select: [
					{ expression: '*', column: '*', table: null, alias: null },
				],
				from: [
					{ expression: 'table AS t', table: 'table', alias: 't' },
					{ expression: 'table2 AS "t2"', table: 'table2', alias: 't2' },
				],
				join: [],
				where: null,
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Simple inner join',
			q: 'SELECT * FROM table INNER JOIN table2 ON table2.id = id_table2',
			a: {
				type: 'select',
				select: [
					{ expression: '*', column: '*', table: null, alias: null },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [
					{ type: 'inner', table: 'table2', alias: null, condition: { expression: 'table2.id = id_table2' } },
				],
				where: null,
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Several joins',
			q: 'SELECT * FROM table INNER JOIN t1 ON t1.id = id_table2 AND t1.bool LEFT JOIN t2 ON t2.id = t1.id_t2 RIGHT JOIN t3 AS table3 ON t3.id = FUNC(t1.stuff)',
			a: {
				type: 'select',
				select: [
					{ expression: '*', column: '*', table: null, alias: null },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [
					{ type: 'inner', table: 't1', alias: null, condition: { expression: 't1.id = id_table2 AND t1.bool' } },
					{ type: 'left', table: 't2', alias: null, condition: { expression: 't2.id = t1.id_t2' } },
					{ type: 'right', table: 't3', alias: 'table3', condition: { expression: 't3.id = FUNC(t1.stuff)' } },
				],
				where: null,
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Where #1',
			q: 'SELECT * FROM table WHERE this >= that AND col IS NOT NULL',
			a: {
				type: 'select',
				select: [
					{ expression: '*', column: '*', table: null, alias: null },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: {
					expression: "this >= that AND col IS NOT NULL",
				},
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Where #2',
			q: 'SELECT * FROM table WHERE (FUNC(this) = "string") AND (1+5 OR col1)',
			a: {
				type: 'select',
				select: [
					{ expression: '*', column: '*', table: null, alias: null },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: {
					expression: "(FUNC(this) = \"string\") AND (1+5 OR col1)",
				},
				group: [],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Group by',
			q: 'SELECT * FROM table GROUP BY col1, MONTH(col2), table.col3',
			a: {
				type: 'select',
				select: [
					{ expression: '*', column: '*', table: null, alias: null },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: null,
				group: [
					{ expression: 'col1', table: null, column: 'col1' },
					{ expression: 'MONTH(col2)', table: null, column: null },
					{ expression: 'table.col3', table: 'table', column: 'col3' },
				],
				order: [],
				limit: null,
			},
		},
		{
			c: 'Order by',
			q: 'SELECT * FROM table ORDER BY table.col1, col2 DESC, FUNC(col3 + 7) ASC',
			a: {
				type: 'select',
				select: [
					{ expression: '*', column: '*', table: null, alias: null },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: null,
				group: [],
				order: [
					{ expression: "table.col1", table: "table", column: "col1", order: "ASC" },
					{ expression: "col2 DESC", table: null, column: "col2", order: "DESC" },
					{ expression: "FUNC(col3 + 7) ASC", table: null, column: null, order: "ASC" },
				],
				limit: null,
			},
		},
		{
			c: 'Limit #1',
			q: 'SELECT * FROM table LIMIT 5',
			a: {
				type: 'select',
				select: [
					{ expression: '*', column: '*', table: null, alias: null },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: null,
				group: [],
				order: [],
				limit: { from: null, nb: 5 },
			},
		},
		{
			c: 'Limit #2',
			q: 'SELECT * FROM table LIMIT 1, 2',
			a: {
				type: 'select',
				select: [
					{ expression: '*', column: '*', table: null, alias: null },
				],
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				join: [],
				where: null,
				group: [],
				order: [],
				limit: { from: 1, nb: 2 },
			},
		},
	];

	var Insert = [
		{
			c: 'Simple insert',
			q: 'INSERT INTO table VALUES (1, 2, 3)',
			a: {
				type: 'insert',
				into: {
					expression: 'table',
					table: 'table',
					alias: null,
				},
				values: [
					{ target: null, value: '1'},
					{ target: null, value: '2'},
					{ target: null, value: '3'},
				],
			},
		},
		{
			c: 'Complex values',
			q: 'INSERT INTO table VALUES (1 + 9, FUNC(2, col), "string")',
			a: {
				type: 'insert',
				into: {
					expression: 'table',
					table: 'table',
					alias: null,
				},
				values: [
					{ target: null, value: '1 + 9'},
					{ target: null, value: 'FUNC(2, col)'},
					{ target: null, value: '"string"'},
				],
			},
		},
		{
			c: 'Insert with columns',
			q: 'INSERT INTO table (col1, `col2`, col3) VALUES (1, 2, 3)',
			a: {
				type: 'insert',
				into: {
					expression: 'table',
					table: 'table',
					alias: null,
				},
				values: [
					{ target: { expression: 'col1', column: 'col1' }, value: '1'},
					{ target: { expression: '`col2`', column: 'col2' }, value: '2'},
					{ target: { expression: 'col3', column: 'col3' }, value: '3'},
				],
			},
		},
	];

	var Update = [
		{
			c: 'Simple update',
			q: 'UPDATE table SET col = "value"',
			a: {
				type: 'update',
				table: {
					expression: 'table',
					table: 'table',
					alias: null,
				},
				where: null,
				values: [
					{ target: { expression: 'col', column: 'col' }, value: '"value"'},
				],
			},
		},
		{
			c: 'Several columns',
			q: 'UPDATE table SET col = "value", col2 = NULL, table.col3 = col',
			a: {
				type: 'update',
				table: {
					expression: 'table',
					table: 'table',
					alias: null,
				},
				where: null,
				values: [
					{ target: { expression: 'col', column: 'col' }, value: '"value"'},
					{ target: { expression: 'col2', column: 'col2' }, value: 'NULL'},
					{ target: { expression: 'table.col3', column: 'col3' }, value: 'col'},
				],
			},
		},
		{
			c: 'Where #1',
			q: 'UPDATE table SET col = "value" WHERE this >= that AND col IS NOT NULL',
			a: {
				type: 'update',
				table: {
					expression: 'table',
					table: 'table',
					alias: null,
				},
				where: {
					expression: "this >= that AND col IS NOT NULL",
				},
				values: [
					{ target: { expression: 'col', column: 'col' }, value: '"value"'},
				],
			},
		},
	];

	var Delete = [
		{
			c: 'Simple delete',
			q: 'DELETE FROM table',
			a: {
				type: 'delete',
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				where: null,
			},
		},
		{
			c: 'Several tables with aliases',
			q: 'DELETE FROM table1 AS t1, table2 "t2"',
			a: {
				type: 'delete',
				from: [
					{ expression: 'table1 AS t1', table: 'table1', alias: 't1' },
					{ expression: 'table2 "t2"', table: 'table2', alias: 't2' },
				],
				where: null,
			},
		},
		{
			c: 'Where #1',
			q: 'DELETE FROM table WHERE this >= that AND col IS NOT NULL',
			a: {
				type: 'delete',
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				where: {
					expression: "this >= that AND col IS NOT NULL",
				},
			},
		},
		{
			c: 'Where #2',
			q: 'DELETE FROM table WHERE (FUNC(this) = "string") AND (1+5 OR col1)',
			a: {
				type: 'delete',
				from: [
					{ expression: 'table', table: 'table', alias: null },
				],
				where: {
					expression: "(FUNC(this) = \"string\") AND (1+5 OR col1)",
				},
			},
		},
	];

	test('sql2ast - select', function() {
		Select.forEach(function(test) {
			testAst(test.c, test.q, test.a);
		});
	});

	test('sql2ast - insert', function() {
		Insert.forEach(function(test) {
			testAst(test.c, test.q, test.a);
		});
	});

	test('sql2ast - update', function() {
		Update.forEach(function(test) {
			testAst(test.c, test.q, test.a);
		});
	});

	test('sql2ast - delete', function() {
		Delete.forEach(function(test) {
			testAst(test.c, test.q, test.a);
		});
	});

	test('ast2sql - select', function() {
		Select.forEach(function(test) {
			testBackAndForth(test.c, test.q);
		});
	});

	test('ast2sql - insert', function() {
		Insert.forEach(function(test) {
			testBackAndForth(test.c, test.q);
		});
	});

	test('ast2sql - update', function() {
		Update.forEach(function(test) {
			testBackAndForth(test.c, test.q);
		});
	});

	test('ast2sql - delete', function() {
		Delete.forEach(function(test) {
			testBackAndForth(test.c, test.q);
		});
	});

})();
