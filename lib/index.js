import validator from 'validator';

const defaultConfig = {
    validator,
};

function doValidation (validator, fnName, value, args) {
    // The argument can be a boolean for argumentless validation, or an
    // array of options passed to the validator
    return typeof args === 'boolean' ?
        validator[fnName](value) === args
        : validator[fnName](value, args.join());
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
                        options = true,
                        error,
                    } = validation;

                    const isValid = doValidation(
                        validator,
                        fnName,
                        propValue,
                        options
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

    bookshelf.Model = bookshelf.Model.extend(Plugin);
}
