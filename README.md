# bookshelf-validate

[![Version (npm)](https://img.shields.io/npm/v/bookshelf-validate.svg)](https://npmjs.com/package/bookshelf-validate)

Validation for the Model objects of Bookshelf.js

## Documentation

Call `bookshelf.plugin('bookshelf-validate');` in your code to use the plugin.

The validation methods are provided by the __validator__ npm package, and can
be extended by providing a `validator` instance as a parameter to the plugin
loader of Bookshelf.

``` js
var validator = require('validator');

validator.extend('isPrime', function (str) {
  var value = parseInt(str);
  if (value === NaN || value < 2) return false;

  for (var i = 2; i <= value >> 1; i++) {
    if (value % i === 0) {
      return false;
    }
  }
});

bookshelf.plugin('bookshelf-validate', validator);
```

By default, none of the model parameters are required. Each model is extended
by a `validationErrors()` method, which can be executed at will.

``` js
var User = bookshelf.Model.extend({
  tableName: 'users',
  validations: {
    // Username is required, and its length must be between 2 and 32 characters
    username: { isRequired: true, isLength: [2, 32] },

    // Email is required, and must be a valid e-mail address
    email: { isRequired: true, isEmail: true },

    // Birthday is not required, but must be a date if given
    birthday: { isDate: true } // isRequired: false
  }
});

var user = new User({
  username: 'x', // Invalid length
  birthday: '1997-11-21', // Valid
  color: 'green' // Not validated
});

let errors = user.validationErrors();
console.log(errors); // See the output below

/*
{
  username: ['isLength'],
  email: ['isRequired']
}
/*
```
