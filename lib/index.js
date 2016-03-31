const validator = require('validator');
const ValidationError = require('./errors').ValidationError;

const defaultConfig = {
  validator,
  validateOnSave: false,
};

function doValidation(validatorObj, fnName, value, args) {
  // The argument can be a boolean for argumentless validation, a single
  // argumentor object, or an array of argument values
  if (typeof args === 'boolean') {
    return validatorObj[fnName](value) === args;
  }

  if (!Array.isArray(args)) {
    return validatorObj[fnName](value, args);
  }

  /* eslint prefer-rest-params: "off" */
  return validatorObj[fnName].apply(validatorObj, arguments.slice(2));
}

function validationPlugin(bookshelf, userConfig) {
  const config = Object.assign({}, defaultConfig, userConfig);

  const Plugin = {
    validationErrors() {
      const output = {};

      function addError(propName, errorName) {
        const propertyErrors = output[propName] || [];

        propertyErrors.push(errorName);
        output[propName] = propertyErrors;
      }

      // Validate each property with the given rule arguments
      for (const propName in this.validations) {
        if (!this.validations.hasOwnProperty(propName)) {
          return null;
        }

        const propValue = this.get(propName);
        const validations = this.validations[propName];

        for (const validation of validations) {
          const fnName = validation.method;
          const args = validation.args || true;
          const error = validation.error;

          const isValid = doValidation(
            validator,
            fnName,
            propValue,
            args
          );

          if (!isValid) {
            const errorMsg = error ? error : method;

            addError(propName, errorMsg);
          }
        }
      }

      // Return null if every property is valid
      return Object.keys(output).length > 0 ? output : null;
    },
  };

  if (config.validateOnSave) {
    Plugin.initialize = function initialize() {
      if (typeof this.validateOnSave === 'function') {
        this.on('saving', this.validateOnSave);
      }
    };

    Plugin.validateOnSave = function validateOnSave() {
      const errors = this.validationErrors();

      if (!errors) return null;
      throw new ValidationError(errors);
    };
  }

  bookshelf.Model = bookshelf.Model.extend(Plugin);
}

module.exports = validationPlugin;
