
test('trim', function () {
	expect(9);

	deepEqual(trim('test'), 'test');
	deepEqual(trim('test '), 'test');
	deepEqual(trim(' test'), 'test');
	deepEqual(trim(' test '), 'test');
	deepEqual(trim('test test'), 'test test');
	deepEqual(trim('    test     \
							'), 'test');
	
	var integer = 5;
	var array = [0, 1, 2];
	var object = {test: "test", great_aswer: 42};
	deepEqual(trim(integer), integer);
	deepEqual(trim(array), array);
	deepEqual(trim(object), object);
});

test('protect/unprotect', function () {
	expect(9);
	
	deepEqual(protect('test'), '#t#e#s#t#');
	deepEqual(protect('#t#e#s#t#'), '###t###e###s###t###');
	
	deepEqual(unprotect('#t#e#s#t#'), 'test');
	deepEqual(unprotect('###t###e###s###t###'), '#t#e#s#t#');
	
	var string = "this is a (complex) string, with some special chars like !:@.#ù%$^\
	and also a line break and des caractères français !";
	deepEqual(unprotect(protect(string)), string);
	
	deepEqual(protect(''), '#');
	deepEqual(unprotect('#'), '');
	deepEqual(protect('#'), '###');
	deepEqual(unprotect('###'), '#');
});

test('protect_split', function () {
	expect(7);
	
	deepEqual(protect_split(',', 'test'), ['test']);
	deepEqual(protect_split(',', 'test(1,2)'), ['test(1,2)']);
	deepEqual(protect_split(',', 'test1,test2'), ['test1', 'test2']);
	deepEqual(protect_split(',', 'test1,(test2,test3)'), ['test1', '(test2,test3)']);
	deepEqual(protect_split(',', 'test1,"test2,test3"'), ['test1', '"test2,test3"']);
	deepEqual(protect_split(',', 'test1,\'test2,test3\''), ['test1', '\'test2,test3\'']);
	deepEqual(protect_split(',', 'test1,`test2,test3`'), ['test1', '`test2,test3`']);
});

test('condition lexer', function () {
	expect(18);

	deepEqual(CondLexer.tokenize('column = othercolumn'), [
		{type: 'word', value: 'column'},
		{type: 'operator', value: '='},
		{type: 'word', value: 'othercolumn'},
	]);

	deepEqual(CondLexer.tokenize('column=othercolumn'), [
		{type: 'word', value: 'column'},
		{type: 'operator', value: '='},
		{type: 'word', value: 'othercolumn'},
	]);

	deepEqual(CondLexer.tokenize('column                 = \
		othercolumn'), [
		{type: 'word', value: 'column'},
		{type: 'operator', value: '='},
		{type: 'word', value: 'othercolumn'},
	]);

	deepEqual(CondLexer.tokenize('table.column = othertable.othercolumn'), [
		{type: 'word', value: 'table.column'},
		{type: 'operator', value: '='},
		{type: 'word', value: 'othertable.othercolumn'},
	]);

	deepEqual(CondLexer.tokenize('table.column <= othertable.othercolumn'), [
		{type: 'word', value: 'table.column'},
		{type: 'operator', value: '<='},
		{type: 'word', value: 'othertable.othercolumn'},
	]);

	deepEqual(CondLexer.tokenize('table.column = "string"'), [
		{type: 'word', value: 'table.column'},
		{type: 'operator', value: '='},
		{type: 'string', value: 'string'},
	]);

	deepEqual(CondLexer.tokenize('table.column = FUNCTION("string")'), [
		{type: 'word', value: 'table.column'},
		{type: 'operator', value: '='},
		{type: 'word', value: 'FUNCTION("string")'},
	]);

	deepEqual(CondLexer.tokenize('table.column = FUNCTION("string", columns,"otherstring"       ,\
		"string with SQL stuff like = AND OR ()")'), [
		{type: 'word', value: 'table.column'},
		{type: 'operator', value: '='},
		{type: 'word', value: 'FUNCTION("string", columns,"otherstring"       ,\
		"string with SQL stuff like = AND OR ()")'},
	]);

	deepEqual(CondLexer.tokenize('table.column != "string with SQL stuff like = AND OR ()"'), [
		{type: 'word', value: 'table.column'},
		{type: 'operator', value: '!='},
		{type: 'string', value: 'string with SQL stuff like = AND OR ()'},
	]);

	deepEqual(CondLexer.tokenize('column = othercolumn AND column < 2'), [
		{type: 'word', value: 'column'},
		{type: 'operator', value: '='},
		{type: 'word', value: 'othercolumn'},
		{type: 'logic', value: 'AND'},
		{type: 'word', value: 'column'},
		{type: 'operator', value: '<'},
		{type: 'word', value: '2'},
	]);

	deepEqual(CondLexer.tokenize('column = othercolumn AND column < 2 OR column = "string"'), [
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
		{type: 'string', value: 'string'},
	]);

	deepEqual(CondLexer.tokenize('(column = othercolumn AND column < 2) OR column = "string"'), [
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
		{type: 'string', value: 'string'},
	]);

	deepEqual(CondLexer.tokenize('column = othercolumn AND (column < 2 OR column = "string")'), [
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
		{type: 'string', value: 'string'},
		{type: 'group', value: ')'},
	]);

	deepEqual(CondLexer.tokenize('column = othercolumn AND column < 2 AND column = "string"'), [
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
		{type: 'string', value: 'string'},
	]);

	deepEqual(CondLexer.tokenize('(column = othercolumn)'), [
		{type: 'group', value: '('},
		{type: 'word', value: 'column'},
		{type: 'operator', value: '='},
		{type: 'word', value: 'othercolumn'},
		{type: 'group', value: ')'},
	]);

	deepEqual(CondLexer.tokenize('column = othercolumn AND (column < 2 OR (column = "string" AND table.othercolumn))'), [
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
		{type: 'string', value: 'string'},
		{type: 'logic', value: 'AND'},
		{type: 'word', value: 'table.othercolumn'},
		{type: 'group', value: ')'},
		{type: 'group', value: ')'},
	]);

	deepEqual(CondLexer.tokenize('column IS NULL'), [
		{type: 'word', value: 'column'},
		{type: 'operator', value: 'IS'},
		{type: 'word', value: 'NULL'},
	]);

	deepEqual(CondLexer.tokenize('column IS NOT NULL'), [
		{type: 'word', value: 'column'},
		{type: 'operator', value: 'IS'},
		{type: 'operator', value: 'NOT'},
		{type: 'word', value: 'NULL'},
	]);
});

test('condition parser', function () {
	expect(18);

	deepEqual(CondParser.parse('column = othercolumn'), {left: 'column', operator: '=', right: 'othercolumn'});

	deepEqual(CondParser.parse('column=othercolumn'), {left: 'column', operator: '=', right: 'othercolumn'});

	deepEqual(CondParser.parse('column                 = \
		othercolumn'), {left: 'column', operator: '=', right: 'othercolumn'});

	deepEqual(CondParser.parse('table.column = othertable.othercolumn'), {left: 'table.column', operator: '=', right: 'othertable.othercolumn'});

	deepEqual(CondParser.parse('table.column <= othertable.othercolumn'), {left: 'table.column', operator: '<=', right: 'othertable.othercolumn'});

	deepEqual(CondParser.parse('table.column = "string"'), {left: 'table.column', operator: '=', right: 'string'});

	deepEqual(CondParser.parse('table.column = FUNCTION("string")'), {left: 'table.column', operator: '=', right: 'FUNCTION("string")'});

	deepEqual(CondParser.parse('table.column = FUNCTION("string", columns,"otherstring"       ,\
		"string with SQL stuff like = AND OR ()")'), {left: 'table.column', operator: '=', right: 'FUNCTION("string", columns,"otherstring"       ,\
		"string with SQL stuff like = AND OR ()")'});

	deepEqual(CondParser.parse('table.column != "string with SQL stuff like = AND OR ()"'), {left: 'table.column', operator: '!=', right: 'string with SQL stuff like = AND OR ()'});

	deepEqual(CondParser.parse('column = othercolumn AND column < 2'), {
		logic: 'AND', terms: [
			{left: 'column', operator: '=', right: 'othercolumn'},
			{left: 'column', operator: '<', right: '2'},
	]});

	deepEqual(CondParser.parse('column = othercolumn AND column < 2 OR column = "string"'), {
		logic: 'OR', terms: [
			{logic: 'AND', terms: [
				{left: 'column', operator: '=', right: 'othercolumn'},
				{left: 'column', operator: '<', right: '2'},
			]},
			{left: 'column', operator: '=', right: 'string'},
	]});

	deepEqual(CondParser.parse('(column = othercolumn AND column < 2) OR column = "string"'), {
		logic: 'OR', terms: [
			{logic: 'AND', terms: [
				{left: 'column', operator: '=', right: 'othercolumn'},
				{left: 'column', operator: '<', right: '2'},
			]},
			{left: 'column', operator: '=', right: 'string'},
	]});

	deepEqual(CondParser.parse('column = othercolumn AND (column < 2 OR column = "string")'), {
		logic: 'AND', terms: [
			{left: 'column', operator: '=', right: 'othercolumn'},
			{logic: 'OR', terms: [
				{left: 'column', operator: '<', right: '2'},
				{left: 'column', operator: '=', right: 'string'},
			]},
	]});

	deepEqual(CondParser.parse('column = othercolumn AND column < 2 AND column = "string"'), {
		logic: 'AND', terms: [
			{left: 'column', operator: '=', right: 'othercolumn'},
			{left: 'column', operator: '<', right: '2'},
			{left: 'column', operator: '=', right: 'string'},
	]});

	deepEqual(CondParser.parse('(column = othercolumn)'), {left: 'column', operator: '=', right: 'othercolumn'});

	deepEqual(CondParser.parse('column = othercolumn AND (column < 2 OR (column = "string" AND table.othercolumn))'), {
		logic: 'AND', terms: [
			{left: 'column', operator: '=', right: 'othercolumn'},
			{logic: 'OR', terms: [
				{left: 'column', operator: '<', right: '2'},
				{logic: 'AND', terms: [
					{left: 'column', operator: '=', right: 'string'},
					'table.othercolumn',
				]},
			]},
	]});

	deepEqual(CondParser.parse('column IS NULL'), {left: 'column', operator: 'IS', right: 'NULL'});

	deepEqual(CondParser.parse('column IS NOT NULL'), {left: 'column', operator: 'IS NOT', right: 'NULL'});
});
