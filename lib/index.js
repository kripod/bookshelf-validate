module.exports = function (bookshelf, validator) {
  'use strict';

  let Model = bookshelf.Model.extend({
    validationErrors: function () {
      let output = {};

      function addError(propertyName, errorName) {
        let propertyErrors = output[propertyName] || [];
        propertyErrors.push(errorName);
        output[propertyName] = propertyErrors;
      }

      // Validate each property with the given rule arguments
      for (let propertyName in this.validations) {
        let propertyValue = this.get(propertyName);
        let validation = this.validations[propertyName];

        // The 'isRequired' validation rule must be evaluated at first
        if (propertyValue == null) {
          if (validation.isRequired) {
            addError(propertyName, 'isRequired');
          }

          // Step to the next validatable property
          continue;
        }

        for (let functionName in validation) {
          // Skip special validation functions
          if (functionName === 'isRequired') {
            continue;
          }

          // The argument can be a boolean for argumentless validation, or an
          // array of options passed to the validator
          let args = validation[functionName];
          let isValid = new Function(
            'validator',
            'return ' + (
              typeof args === 'boolean' ?
                `validator.${functionName}('${propertyValue}') == ${args}` :
                `validator.${functionName}('${propertyValue}', ${args.join()})`
            )
          )(validator || require('validator'));

          // Handle validation errors if needed
          if (!isValid) {
            addError(propertyName, functionName);
          }
        }
      }

      // Return null if every property is valid
      return Object.keys(output).length > 0 ? output : null;
    }
  });

  bookshelf.Model = Model;
};
