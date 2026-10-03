function validate(schema, source = "body") {
  return (req, res, next) => {
    // TODO: Run schema.safeParse on req[source], respond with 400 and the flattened
    // TODO: issues on failure, and replace req[source] with the parsed data on success.
    return next();
  };
}

module.exports = { validate };
