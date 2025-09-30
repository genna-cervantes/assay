import { createEval, exactMatch } from ".";

const testEval = createEval({
  name: "test-eval",
  cases: [
    {
      input: "what day is it today",
      expected: {
        output: "Monday",
      },
    },
  ],
  target: async () => {
    return new Promise((resolve, reject) => {
      resolve({ output: "Monday" });
    });
  },
  evaluators: [exactMatch({ caseSensitive: true })],
});

const evalResults = await testEval.run();

console.log(JSON.stringify(evalResults));
