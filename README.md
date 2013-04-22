sqlParser.js
============

Javascript library to parse CRUD (Create Retrieve Update Delete) SQL queries.

## How to use

Import the JS file in your page:

```html
<script src="sqlParser.js"></script>
```

Parse a query:

```js
var output = parseSQL('your SQL query');
console.log(output);
```

## Example

See `example.html` (open brower's console).

## Notes

sqlParser.js only supports these queries:
* SELECT
* INSERT
* UPDATE
* DELETE

sqlParser.js **is not a full SQL parser!**
It only support few SQL mechanisms and keywords.
Feel free to make a pull request/issue.

*sqlParser.js was made for @GestionAIR*

## License

The MIT License (MIT)
Copyright (c) 2013 David Sferruzza
 
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

