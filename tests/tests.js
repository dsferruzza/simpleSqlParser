(function () {
	"use strict";

	var m = simpleSqlParser;

	function ok(ast) {
		return {
			status: true,
			value: ast
		};
	}

	function testAst(query, ast) {
		deepEqual(m.sql2ast(query), ok(ast), query);
	}

	test('sql2ast', function() {
		
		testAst('SELECT * FROM table', {
			type: 'select',
			select: [
				{ expression: '*', column: '*', table: null, alias: null }
			],
			from: [
				{ table: 'table', alias: null }
			]
		});

	});

})();
