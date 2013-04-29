
test('trim', function () {
	expect(8);

	deepEqual(trim('test'), 'test');
	deepEqual(trim('test '), 'test');
	deepEqual(trim(' test'), 'test');
	deepEqual(trim(' test '), 'test');
	deepEqual(trim('test test'), 'test test');
	
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
	and also a line break";
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
