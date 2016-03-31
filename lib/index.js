import validator from 'validator';
import ValidationError from './errors';

const defaultConfig = {
    validator,
    validateOnSave: false,
};

function doValidation (validator, fnName, value, args) {
    // The argument can be a boolean for argumentless validation,
    // a single argument or object, or an array of argument values
    if (typeof args === 'boolean') {
        return validator[fnName](value) === args;
    }

    if (!Array.isArray(args)) {
        return validator[fnName](value, args);
    }

    return validator[fnName](value, ...args);
}

export default function validationPlugin (bookshelf, config = defaultConfig) {
    var Plugin = {
        validationErrors () {
            const output = {};

            function addError (propName, errorName) {
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
                    const {
                        method: fnName,
                        args = true,
                        error,
                    } = validation;

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
        Plugin.initialize = function initialize () {
            if (typeof this.validateOnSave === 'function') {
                this.on('saving', this.validateOnSave);
            }
        };

        Plugin.validateOnSave = function validateOnSave () {
            const errors = this.validationErrors();

            if (errors == null) {
                return null;
            }

            throw new ValidationError(errors);
        };
    }

    bookshelf.Model = bookshelf.Model.extend(Plugin);
}
