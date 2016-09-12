/**
 * Base error class.
 */
export class ExtendableError extends Error {
  /**
   * Constructor.
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-12
   * @param   {String}  message  Custom error message.
   */
  constructor (message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    Error.captureStackTrace(this, this.constructor.name);
  }
}

/**
 * D3 version 4 not found error.
 */
export class D3VersionFourRequired extends ExtendableError {
  /**
   * Constructor
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-12
   * @param   {String}  versionFound  D3 version string.
   */
  constructor (versionFound) {
    super(
      'D3 version 4 is required to run the code. Found version ' + versionFound
    );
  }
}

/**
 * When varible is no object
 */
export class NoObject extends ExtendableError {
  /**
   * Constructor
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-12
   * @param   {String}  variableName  Name of the variable that ought to be an
   *   object.
   */
  constructor (variableName) {
    super(
      'The "' + variableName + '" must be an object.'
    );
  }
}
