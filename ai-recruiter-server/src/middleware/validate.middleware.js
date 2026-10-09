function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = details;
      return next(error);
    }
    req[source] = result.data;
    return next();
  };
}

module.exports = { validate };
