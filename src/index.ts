import {
  CreateEvalOptions,
  Case,
  RunEvalOptions,
  EvaluatorResult,
  Metrics,
} from "./types";
import { tryCatch } from "./utils";

export const createEval = ({ ...args }: CreateEvalOptions): RunEvalOptions => {
  return {
    async run() {
      console.log('running eval')
      const start = Date.now();

      let evaluations: EvaluatorResult[] = [];
      let metrics: Metrics = {
        score: {
          avg: 0,
          min: 1,
          max: 0,
          passRate: 0,
        },
        latency: {
          avg: 0,
          min: 0,
          max: 0,
          p50: 0,
          p95: 0,
          p99: 0,
          total: 0,
        },
        tokens: {
          total: 0,
          avg: 0,
          min: 0,
          max: 0,
        },
        cost: {
          total: 0,
          avg: 0,
          breakdown: {
            input: 0,
            output: 0,
            cached: 0,
          },
        },
        toolCalls: {
          total: 0,
          avg: 0,
          byTool: {},
          successRate: 0,
        },
        execution: {
          totalTests: 0,
          passed: 0,
          failed: 0,
          errored: 0,
          duration: 0,
        },
      };

      console.log('running cases')
      if (Array.isArray(args.cases)) {
        // loop thru the cases
        for (let i = 0; i < args.cases.length; i++) {
          const testCase = args.cases[i];
          console.log(testCase)

          const caseResult = await tryCatch(args.target(testCase.input));
          console.log(caseResult)

          if (caseResult.error) {
            metrics.execution.errored += 1;

            if (!metrics.execution?.errorLogs) {
              metrics.execution.errorLogs = [];
            }

            if (caseResult.error instanceof Error) {
              metrics.execution.errorLogs.push(caseResult.error.message);
              continue;
            }
          }

          // loop thru the evaluators
          console.log('running evaluators')
          for (let j = 0; j < args.evaluators.length; j++) {
            const evaluator = args.evaluators[j];
            let evaluation = await evaluator({agentOutput: caseResult.value, expectedOutput: testCase.expected});
            console.log(evaluation)

            if (evaluation.passed) {
              metrics.execution.passed += 1;
            } else {
              metrics.execution.failed += 1;
            }

            if (metrics.score.min > evaluation.score) {
              metrics.score.min = evaluation.score;
            }

            if (metrics.score.max < evaluation.score) {
              metrics.score.max = evaluation.score;
            }

            metrics.score.avg = (metrics.score.avg + evaluation.score) / 2;

            evaluations.push(evaluation);
          }
        }

        const end = Date.now();
        metrics.execution.duration = end - start;
        metrics.execution.totalTests =
          args.cases.length * args.evaluators.length;
        metrics.score.passRate =
          (metrics.execution.passed / metrics.execution.totalTests) * 100;

        return {
          evaluations,
          metrics,
        };
      } else {
        let earlyStop = false;

        const testCase = args.cases;
        const caseResult = await tryCatch(args.target(testCase.input));

        if (caseResult.error) {
          metrics.execution.errored += 1;

          if (!metrics.execution?.errorLogs) {
            metrics.execution.errorLogs = [];
          }

          if (caseResult.error instanceof Error) {
            metrics.execution.errorLogs.push(caseResult.error.message);
            earlyStop = true;
          }
        }

        // loop thru the evaluators
        if (!earlyStop) {
          for (let j = 0; j < args.evaluators.length; j++) {
            const evaluator = args.evaluators[j];
            let evaluation = await evaluator({agentOutput: caseResult, expectedOutput: testCase.expected});

            if (evaluation.passed) {
              metrics.execution.passed += 1;
            } else {
              metrics.execution.failed += 1;
            }

            if (metrics.score.min > evaluation.score) {
              metrics.score.min = evaluation.score;
            }

            if (metrics.score.max < evaluation.score) {
              metrics.score.max = evaluation.score;
            }

            metrics.score.avg = (metrics.score.avg + evaluation.score) / 2;

            evaluations.push(evaluation);
          }
        }

        const end = Date.now();
        metrics.execution.duration = end - start;
        metrics.execution.totalTests = args.evaluators.length;
        metrics.score.passRate =
          (metrics.execution.passed / metrics.execution.totalTests) * 100;

        return {
          evaluations,
          metrics,
        };
      }
    },
  };
};

export const exactMatch = ({
  caseSensitive,
  ignoreWhitespace,
}: {
  caseSensitive?: boolean;
  ignoreWhitespace?: boolean;
}) => {
    return ({expectedOutput, agentOutput}: {expectedOutput: any, agentOutput: any}): EvaluatorResult => {

        if (JSON.stringify(agentOutput) === JSON.stringify(expectedOutput)){
            return {
                id: '123',
                passed: true,
                score: 1,
                confidence: 1
            }
        }else{
            if (!caseSensitive && JSON.stringify(agentOutput).toLowerCase() === JSON.stringify(expectedOutput).toLowerCase()){
                return {
                    id: '123',
                    passed: true,
                    score: 1,
                    confidence: 1
                }
            }else{
                return {
                    id: '123',
                    passed: false,
                    score: 0,
                    confidence: 1
                }
            }
        }
    }
};
