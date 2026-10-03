function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          details
        }
      });
    }
    req[source] = result.data;
    return next();
  };
}

module.exports = { validate };
