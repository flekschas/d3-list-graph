export class ExtendableError extends Error {
  constructor (message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    Error.captureStackTrace(this, this.constructor.name);
  }
}

export class D3VersionFourRequired extends ExtendableError {
  constructor (versionFound) {
    super(
      'D3 version 4 is required to run the code. Found version ' + versionFound
    );
  }
}

