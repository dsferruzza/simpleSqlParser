(function () {
	"use strict";

	var m = simpleSqlParser;

	module('sql2ast');

	test('trim', function () {
		expect(9);

		deepEqual(m.trim('test'), 'test');
		deepEqual(m.trim('test '), 'test');
		deepEqual(m.trim(' test'), 'test');
		deepEqual(m.trim(' test '), 'test');
		deepEqual(m.trim('test test'), 'test test');
		deepEqual(m.trim('    test     \
								'), 'test');
		
		var integer = 5;
		var array = [0, 1, 2];
		var object = {test: "test", great_aswer: 42};
		deepEqual(m.trim(integer), integer);
		deepEqual(m.trim(array), array);
		deepEqual(m.trim(object), object);
	});

	test('protect/unprotect', function () {
		expect(9);
		
		deepEqual(m.protect('test'), '#t#e#s#t#');
		deepEqual(m.protect('#t#e#s#t#'), '###t###e###s###t###');
		
		deepEqual(m.unprotect('#t#e#s#t#'), 'test');
		deepEqual(m.unprotect('###t###e###s###t###'), '#t#e#s#t#');
		
		var string = "this is a (complex) string, with some special chars like !:@.#ù%$^\
		and also a line break and des caractères français !";
		deepEqual(m.unprotect(m.protect(string)), string);
		
		deepEqual(m.protect(''), '#');
		deepEqual(m.unprotect('#'), '');
		deepEqual(m.protect('#'), '###');
		deepEqual(m.unprotect('###'), '#');
	});

	test('protect_split', function () {
		expect(10);
		
		deepEqual(m.protect_split(',', 'test'), ['test']);
		deepEqual(m.protect_split(',', 'test(1,2)'), ['test(1,2)']);
		deepEqual(m.protect_split(',', 'test1,test2'), ['test1', 'test2']);
		deepEqual(m.protect_split(',', 'test1,(test2,test3)'), ['test1', '(test2,test3)']);
		deepEqual(m.protect_split(';', 'test1;(test2;test3)'), ['test1', '(test2;test3)']);
		deepEqual(m.protect_split(',', 'test1,"test2,test3"'), ['test1', '"test2,test3"']);
		deepEqual(m.protect_split(',', 'test1,\'test2,test3\''), ['test1', '\'test2,test3\'']);
		deepEqual(m.protect_split(',', 'test1,`test2,test3`'), ['test1', '`test2,test3`']);
		deepEqual(m.protect_split(',', 'test1,function(test2,"test3(test4)\'test5\'"),test6()'), ['test1', 'function(test2,"test3(test4)\'test5\'")', 'test6()']);
		deepEqual(m.protect_split(',', 'column1, column2, FUNCTION("string )\'\'", column3),  column4 AS Test1,column5 AS "Test 2", column6 "Test,3" '), [
			'column1',
			'column2',
			'FUNCTION("string )\'\'", column3)',
			'column4 AS Test1',
			'column5 AS "Test 2"',
			'column6 "Test,3"',
		]);
	});

	test('condition lexer', function () {
		expect(19);

		deepEqual(m.CondLexer.tokenize('column = othercolumn'), [
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'othercolumn'},
		]);

		deepEqual(m.CondLexer.tokenize('column=othercolumn'), [
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'othercolumn'},
		]);

		deepEqual(m.CondLexer.tokenize('column                 = \
			othercolumn'), [
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'othercolumn'},
		]);

		deepEqual(m.CondLexer.tokenize('table.column = othertable.othercolumn'), [
			{type: 'word', value: 'table.column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'othertable.othercolumn'},
		]);

		deepEqual(m.CondLexer.tokenize('table.column <= othertable.othercolumn'), [
			{type: 'word', value: 'table.column'},
			{type: 'operator', value: '<='},
			{type: 'word', value: 'othertable.othercolumn'},
		]);

		deepEqual(m.CondLexer.tokenize('table.column = "string"'), [
			{type: 'word', value: 'table.column'},
			{type: 'operator', value: '='},
			{type: 'string', value: '"string"'},
		]);

		deepEqual(m.CondLexer.tokenize('table.column = FUNCTION("string")'), [
			{type: 'word', value: 'table.column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'FUNCTION("string")'},
		]);

		deepEqual(m.CondLexer.tokenize('table.column = FUNCTION("string", columns,"otherstring"       ,\
			"string with SQL stuff like = AND OR ()")'), [
			{type: 'word', value: 'table.column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'FUNCTION("string", columns,"otherstring"       ,\
			"string with SQL stuff like = AND OR ()")'},
		]);

		deepEqual(m.CondLexer.tokenize('table.column != "string with SQL stuff like = AND OR ()"'), [
			{type: 'word', value: 'table.column'},
			{type: 'operator', value: '!='},
			{type: 'string', value: '"string with SQL stuff like = AND OR ()"'},
		]);

		deepEqual(m.CondLexer.tokenize('column = othercolumn AND column < 2'), [
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'othercolumn'},
			{type: 'logic', value: 'AND'},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '<'},
			{type: 'word', value: '2'},
		]);

		deepEqual(m.CondLexer.tokenize('column = othercolumn AND column < 2 OR column = "string"'), [
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'othercolumn'},
			{type: 'logic', value: 'AND'},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '<'},
			{type: 'word', value: '2'},
			{type: 'logic', value: 'OR'},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'string', value: '"string"'},
		]);

		deepEqual(m.CondLexer.tokenize('column = othercolumn OR column < 2 AND column = "string"'), [
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'othercolumn'},
			{type: 'logic', value: 'OR'},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '<'},
			{type: 'word', value: '2'},
			{type: 'logic', value: 'AND'},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'string', value: '"string"'},
		]);

		deepEqual(m.CondLexer.tokenize('(column = othercolumn AND column < 2) OR column = "string"'), [
			{type: 'group', value: '('},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'othercolumn'},
			{type: 'logic', value: 'AND'},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '<'},
			{type: 'word', value: '2'},
			{type: 'group', value: ')'},
			{type: 'logic', value: 'OR'},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'string', value: '"string"'},
		]);

		deepEqual(m.CondLexer.tokenize('column = othercolumn AND (column < 2 OR column = "string")'), [
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'othercolumn'},
			{type: 'logic', value: 'AND'},
			{type: 'group', value: '('},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '<'},
			{type: 'word', value: '2'},
			{type: 'logic', value: 'OR'},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'string', value: '"string"'},
			{type: 'group', value: ')'},
		]);

		deepEqual(m.CondLexer.tokenize('column = othercolumn AND column < 2 AND column = "string"'), [
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'othercolumn'},
			{type: 'logic', value: 'AND'},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '<'},
			{type: 'word', value: '2'},
			{type: 'logic', value: 'AND'},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'string', value: '"string"'},
		]);

		deepEqual(m.CondLexer.tokenize('(column = othercolumn)'), [
			{type: 'group', value: '('},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'othercolumn'},
			{type: 'group', value: ')'},
		]);

		deepEqual(m.CondLexer.tokenize('column = othercolumn AND (column < 2 OR (column = "string" AND table.othercolumn))'), [
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'word', value: 'othercolumn'},
			{type: 'logic', value: 'AND'},
			{type: 'group', value: '('},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '<'},
			{type: 'word', value: '2'},
			{type: 'logic', value: 'OR'},
			{type: 'group', value: '('},
			{type: 'word', value: 'column'},
			{type: 'operator', value: '='},
			{type: 'string', value: '"string"'},
			{type: 'logic', value: 'AND'},
			{type: 'word', value: 'table.othercolumn'},
			{type: 'group', value: ')'},
			{type: 'group', value: ')'},
		]);

		deepEqual(m.CondLexer.tokenize('column IS NULL'), [
			{type: 'word', value: 'column'},
			{type: 'operator', value: 'IS'},
			{type: 'word', value: 'NULL'},
		]);

		deepEqual(m.CondLexer.tokenize('column IS NOT NULL'), [
			{type: 'word', value: 'column'},
			{type: 'operator', value: 'IS'},
			{type: 'operator', value: 'NOT'},
			{type: 'word', value: 'NULL'},
		]);
	});

	test('condition parser', function () {
		expect(20);

		deepEqual(m.CondParser.parse('column = othercolumn'), {left: 'column', operator: '=', right: 'othercolumn'});

		deepEqual(m.CondParser.parse('column=othercolumn'), {left: 'column', operator: '=', right: 'othercolumn'});

		deepEqual(m.CondParser.parse('column                 = \
			othercolumn'), {left: 'column', operator: '=', right: 'othercolumn'});

		deepEqual(m.CondParser.parse('table.column = othertable.othercolumn'), {left: 'table.column', operator: '=', right: 'othertable.othercolumn'});

		deepEqual(m.CondParser.parse('table.column <= othertable.othercolumn'), {left: 'table.column', operator: '<=', right: 'othertable.othercolumn'});

		deepEqual(m.CondParser.parse('table.column = "string"'), {left: 'table.column', operator: '=', right: '"string"'});

		deepEqual(m.CondParser.parse('table.column = FUNCTION("string")'), {left: 'table.column', operator: '=', right: 'FUNCTION("string")'});

		deepEqual(m.CondParser.parse('table.column = FUNCTION("string", columns,"otherstring"       ,\
			"string with SQL stuff like = AND OR ()")'), {left: 'table.column', operator: '=', right: 'FUNCTION("string", columns,"otherstring"       ,\
			"string with SQL stuff like = AND OR ()")'});

		deepEqual(m.CondParser.parse('table.column != "string with SQL stuff like = AND OR ()"'), {left: 'table.column', operator: '!=', right: '"string with SQL stuff like = AND OR ()"'});

		deepEqual(m.CondParser.parse('column = othercolumn AND column < 2'), {
			logic: 'AND', terms: [
				{left: 'column', operator: '=', right: 'othercolumn'},
				{left: 'column', operator: '<', right: '2'},
		]});

		deepEqual(m.CondParser.parse('column = othercolumn AND column < 2 OR column = "string"'), {
			logic: 'OR', terms: [
				{logic: 'AND', terms: [
					{left: 'column', operator: '=', right: 'othercolumn'},
					{left: 'column', operator: '<', right: '2'},
				]},
				{left: 'column', operator: '=', right: '"string"'},
		]});

		deepEqual(m.CondParser.parse('column = othercolumn OR column < 2 AND column = "string"'), {
			logic: 'AND', terms: [
				{logic: 'OR', terms: [
					{left: 'column', operator: '=', right: 'othercolumn'},
					{left: 'column', operator: '<', right: '2'},
				]},
				{left: 'column', operator: '=', right: '"string"'},
		]});

		deepEqual(m.CondParser.parse('(column = othercolumn AND column < 2) OR column = "string"'), {
			logic: 'OR', terms: [
				{logic: 'AND', terms: [
					{left: 'column', operator: '=', right: 'othercolumn'},
					{left: 'column', operator: '<', right: '2'},
				]},
				{left: 'column', operator: '=', right: '"string"'},
		]});

		deepEqual(m.CondParser.parse('column = othercolumn AND (column < 2 OR column = "string")'), {
			logic: 'AND', terms: [
				{left: 'column', operator: '=', right: 'othercolumn'},
				{logic: 'OR', terms: [
					{left: 'column', operator: '<', right: '2'},
					{left: 'column', operator: '=', right: '"string"'},
				]},
		]});

		deepEqual(m.CondParser.parse('column = othercolumn AND column < 2 AND column = "string"'), {
			logic: 'AND', terms: [
				{left: 'column', operator: '=', right: 'othercolumn'},
				{left: 'column', operator: '<', right: '2'},
				{left: 'column', operator: '=', right: '"string"'},
		]});

		deepEqual(m.CondParser.parse('(column = othercolumn)'), {left: 'column', operator: '=', right: 'othercolumn'});

		deepEqual(m.CondParser.parse('column = othercolumn AND (column < 2 OR (column = "string" AND table.othercolumn))'), {
			logic: 'AND', terms: [
				{left: 'column', operator: '=', right: 'othercolumn'},
				{logic: 'OR', terms: [
					{left: 'column', operator: '<', right: '2'},
					{logic: 'AND', terms: [
						{left: 'column', operator: '=', right: '"string"'},
						'table.othercolumn',
					]},
				]},
		]});

		deepEqual(m.CondParser.parse('(a AND b) OR (c AND d)'), {
			logic: 'OR', terms: [
				{logic: 'AND', terms: ['a', 'b']},
				{logic: 'AND', terms: ['c', 'd']},
		]});

		deepEqual(m.CondParser.parse('column IS NULL'), {left: 'column', operator: 'IS', right: 'NULL'});

		deepEqual(m.CondParser.parse('column IS NOT NULL'), {left: 'column', operator: 'IS NOT', right: 'NULL'});
	});

	test('parse SQL', function() {
		expect(27);
		var q;

		q = 'SELECT * FROM table';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: '*'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
		}, q);

		q = 'select * from table';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: '*'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
		}, q);

		q = 'SELECT * FROM table;';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: '*'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
		}, q);


		q = 'SELECT * FROM table AS t';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: '*'}],
			'FROM': [{
				table: 'table',
				as: 't',
			}],
		}, q);

		q = 'SELECT * FROM table; SELECT * FROM table2';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: '*'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
		}, q);

		q = 'SELECT column1, column2, FUNCTION("string ()\'\'", column3),  column4 AS Test1,column5 AS "Test 2", column6 "Test 3" FROM table';
		deepEqual(m.sql2ast(q), {
			'SELECT': [
				{name: 'column1'},
				{name: 'column2'},
				{name: 'FUNCTION("string ()\'\'", column3)'},
				{name: 'column4 AS Test1'},
				{name: 'column5 AS "Test 2"'},
				{name: 'column6 "Test 3"'},
			],
			'FROM': [{
				table: 'table',
				as: '',
			}],
		}, q);

		q = 'SELECT FUCTION("SQL syntax like: FROM or LIMIT", \'SQL syntax like: FROM or LIMIT\', `SQL syntax like: FROM or LIMIT`) FROM table';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: 'FUCTION("SQL syntax like: FROM or LIMIT", \'SQL syntax like: FROM or LIMIT\', `SQL syntax like: FROM or LIMIT`)'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
		}, q);

		q = 'SELECT * FROM table1,table2 AS t2   ,   table3 AS "t 3"';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: '*'}],
			'FROM': [
				{table: 'table1',	as: ''},
				{table: 'table2',	as: 't2'},
				{table: 'table3',	as: 't 3'},
			],
		}, q);

		q = 'SELECT * FROM table LEFT JOIN table2 ON table.id = table2.id_table INNER JOIN table4 AS t4 ON table.id = FUNCTION(table4.id_table, "string()") JOIN table3 ON table.id=table3.id_table';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: '*'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
			'JOIN': [
				{
					type: 'left',
					table: 'table2',
					as: '',
					cond: {left: 'table.id', operator: '=', right: 'table2.id_table'},
				},
				{
					type: 'left',
					table: 'table3',
					as: '',
					cond: {left: 'table.id', operator: '=', right: 'table3.id_table'},
				},
				{
					type: 'inner',
					table: 'table4',
					as: 't4',
					cond: {left: 'table.id', operator: '=', right: 'FUNCTION(table4.id_table, "string()")'},
				},
			],
		}, q);

		q = 'SELECT * FROM table LEFT JOIN table2 AS t2 ON table.id = t2.id_table';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: '*'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
			'JOIN': [
				{
					type: 'left',
					table: 'table2',
					as: 't2',
					cond: {left: 'table.id', operator: '=', right: 't2.id_table'},
				},
			],
		}, q);

		q = 'SELECT * FROM table WHERE (column1 = "something ()" AND table.column2 != column3) AND (column4 OR column5 IS NOT NULL)';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: '*'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
			'WHERE': {
				logic: 'AND', terms: [
					{left: 'column1', operator: '=', right: '"something ()"'},
					{left: 'table.column2', operator: '!=', right: 'column3'},
					{logic: 'OR', terms: [
						'column4',
						{left: 'column5', operator: 'IS NOT', right: 'NULL'},
					]},
				],
			},
		}, q);

		q = 'SELECT * FROM table ORDER BY column1 ASC, column2 DESC';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: '*'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
			'ORDER BY': [
				{column: 'column1', order: 'ASC'},
				{column: 'column2', order: 'DESC'},
			],
		}, q);

		q = 'SELECT * FROM table GROUP BY column1, column2';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: '*'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
			'GROUP BY': [
				{column: 'column1'},
				{column: 'column2'},
			],
		}, q);

		deepEqual(m.sql2ast('SELECT * FROM table LIMIT 5'), {
			'SELECT': [{name: '*'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
			'LIMIT': {nb: 5, from: 0},
		}, q);

		q = 'SELECT * FROM table LIMIT 10,20';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: '*'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
			'LIMIT': {nb: 20, from: 10},
		}, q);

		q = 'SELECT EXTRACT(MICROSECOND FROM "2003-01-02 10:30:00.00123") FROM table';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: 'EXTRACT(MICROSECOND FROM "2003-01-02 10:30:00.00123")'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
		}, q);

		q = 'SELECT column1, FROM table, ORDER BY id ASC,';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: 'column1'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
			'ORDER BY': [{column: 'id', order: 'ASC'}],
		}, q);

		q = 'SELECT column1, FROM table, GROUP BY id,';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: 'column1'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
			'GROUP BY': [{column: 'id'}],
		}, q);

		q = 'SELECT column1, setup, column2 FROM table';
		deepEqual(m.sql2ast(q), {
			'SELECT': [{name: 'column1'}, {name: 'setup'}, {name: 'column2'}],
			'FROM': [{
				table: 'table',
				as: '',
			}],
		}, q);

		q = 'DELETE FROM table WHERE id = 5';
		deepEqual(m.sql2ast(q), {
			'DELETE FROM': [{
				table: 'table',
				as: '',
			}],
			'WHERE': {left: 'id', operator: '=', right: '5'},
		}, q);

		q = 'DELETE FROM table WHERE id = 5';
		deepEqual(m.sql2ast(q, false), {
			'DELETE FROM': [{
				table: 'table',
				as: '',
			}],
			'WHERE': 'id = 5',
		}, q);

		q = 'INSERT INTO table (column1, column2) VALUES("test ()", CURDATE())';
		deepEqual(m.sql2ast(q), {
			'INSERT INTO': {
				table: 'table',
				columns: ['column1', 'column2'],
			},
			'VALUES': [['"test ()"', 'CURDATE()']],
		}, q);

		q = 'INSERT INTO table (col_A,col_B,col_C) VALUES (1,2,3)';
		deepEqual(m.sql2ast(q), {
			'INSERT INTO': {
				table: 'table',
				columns: ['col_A', 'col_B', 'col_C'],
			},
			'VALUES': [['1', '2', '3']],
		}, q);

		q = 'INSERT INTO table VALUES (1,2,3), (4,5,6), (7,8,9)';
		deepEqual(m.sql2ast(q), {
			'INSERT INTO': {table: 'table'},
			'VALUES': [
				['1', '2', '3'],
				['4', '5', '6'],
				['7', '8', '9'],
			],
		}, q);

		q = 'INSERT INTO table (col_A,col_B,col_C) VALUES (1,2,3), (4,5,6), (7,8,9)';
		deepEqual(m.sql2ast(q), {
			'INSERT INTO': {
				table: 'table',
				columns: ['col_A', 'col_B', 'col_C'],
			},
			'VALUES': [
				['1', '2', '3'],
				['4', '5', '6'],
				['7', '8', '9'],
			],
		}, q);

		q = 'INSERT INTO table VALUES (1,2,3)';
		deepEqual(m.sql2ast(q), {
			'INSERT INTO': {table: 'table'},
			'VALUES': [['1', '2', '3']],
		}, q);

		q = 'UPDATE table SET column1 = "string ()", column2=5,column3=column4, column5 = CURDATE(), column6 = FUNCTION("string ()", column7) WHERE id = 5';
		deepEqual(m.sql2ast(q), {
			'UPDATE': [{
				table: 'table',
				as: '',
			}],
			'SET': [
				{ expression: 'column1 = "string ()"'},
				{ expression: 'column2=5'},
				{ expression: 'column3=column4'},
				{ expression: 'column5 = CURDATE()'},
				{ expression: 'column6 = FUNCTION("string ()", column7)'},
			],
			'WHERE': {left: 'id', operator: '=', right: '5'},
		}, q);
	});

	test('Infinite loop', function() {
		m.sql2ast('SELECT * FROM foo where "a');
		ok(true);
	});




	module('ast2sql');

	test('SELECT query', function() {
		expect(14);
		var q;

		q = 'SELECT * FROM table';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'SELECT * FROM table';
		deepEqual(m.ast2sql(m.sql2ast('select * from table')), q, q);

		q = 'SELECT * FROM table1, table2';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'SELECT t.column1, ot.column2 FROM table AS t LEFT JOIN othertable AS ot ON t.id = ot.id_table WHERE t.column3 = 5';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'SELECT * FROM table AS t LEFT JOIN othertable AS ot ON t.id = ot.id_table LEFT JOIN othertable2 AS ot2 ON t.id = ot2.id_table AND ot2.column INNER JOIN othertable3 AS ot3 ON t.id = ot3.id_table';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'SELECT * FROM table WHERE (column1 = "something ()" AND table.column2 != column3) AND (column4 OR column5 IS NOT NULL)';
		deepEqual(m.ast2sql(m.sql2ast(q)), 'SELECT * FROM table WHERE column1 = "something ()" AND table.column2 != column3 AND (column4 OR column5 IS NOT NULL)', q);

		q = 'SELECT * FROM table ORDER BY a ASC, b DESC, c ASC';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'SELECT * FROM table GROUP BY a, b';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'SELECT * FROM table LIMIT 1';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'SELECT * FROM table LIMIT 10,1';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'SELECT * FROM table LIMIT 1';
		deepEqual(m.ast2sql({'SELECT': [{name: '*'}], 'FROM': [{table: 'table', as: ''}], 'LIMIT': {'nb': '1'}}), q, q);

		q = 'SELECT * FROM table';
		deepEqual(m.ast2sql({'SELECT': [{name: '*'}], 'FROM': [{table: 'table', as: ''}], 'LIMIT': {'nb': ''}}), q, q);

		q = 'SELECT * FROM table LIMIT 1';
		deepEqual(m.ast2sql({'SELECT': [{name: '*'}], 'FROM': [{table: 'table', as: ''}], 'LIMIT': {'from': null, 'nb': '1'}}), q, q);

		q = 'SELECT * FROM table LIMIT 1';
		deepEqual(m.ast2sql({'SELECT': [{name: '*'}], 'FROM': [{table: 'table', as: ''}], 'LIMIT': {'from': '-1', 'nb': '1'}}), q, q);
	});

	test('INSERT query', function() {
		expect(4);
		var q;

		q = 'INSERT INTO table (col_A, col_B, col_C) VALUES (1, 2, 3)';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'INSERT INTO table VALUES (1, 2, 3), (4, 5, 6), (7, 8, 9)';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'INSERT INTO table (col_A, col_B, col_C) VALUES (1, 2, 3), (4, 5, 6), (7, 8, 9)';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'INSERT INTO table VALUES (1, 2, 3)';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);
	});

	test('DELETE query', function() {
		expect(2);
		var q;

		q = 'DELETE FROM table WHERE id = 5';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'DELETE FROM table1, table2 WHERE id = 5';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);
	});

	test('UPDATE query', function() {
		expect(3);
		var q;

		q = 'UPDATE table SET column = 1';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'UPDATE table1, table2 SET column = 1';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);

		q = 'UPDATE table SET column1 = "string ()", column2=5, column3=column4, column5 = CURDATE(), column6 = FUNCTION("string ()", column7) WHERE id = 5';
		deepEqual(m.ast2sql(m.sql2ast(q)), q, q);
	});

}());
