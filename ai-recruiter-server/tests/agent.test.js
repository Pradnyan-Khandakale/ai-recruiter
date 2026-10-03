const { runShortlistingAgent } = require("../src/agents/shortlisting.agent");

test("shortlisting agent returns serializable JSON", async () => {
  const result = await runShortlistingAgent({
    matching: { data: { match_score: 85, missing_skills: [] } }
  });

  expect(result.success).toBe(true);
  expect(JSON.parse(JSON.stringify(result))).toEqual(result);
});
