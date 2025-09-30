export interface RunEvalOptions {
    run(): Promise<RunEvalResult>
}

interface RunEvalResult {
    evaluations: EvaluatorResult[]
    metrics: Metrics
}

export interface CreateEvalOptions<TTargetOptions = unknown, TCaseField = unknown, TToolArgs = unknown, TToolResult = unknown> {
    name: string
    target: (options: TTargetOptions) => Promise<any>
    cases: Case<TCaseField, TToolArgs, TToolResult> | Case<TCaseField, TToolArgs, TToolResult>[]
    evaluators: ((options: EvaluatorOptions) => EvaluatorResult|Promise<EvaluatorResult>)[]
}

export interface Case<TCaseField = unknown, TToolArgs = unknown, TToolResult = unknown> {
    input: string
    expected: Expected<TCaseField, TToolArgs, TToolResult>
}

interface ExpectedBase<TToolArgs = unknown, TToolResult = unknown> {
  toolCalls?: ToolCall<TToolArgs, TToolResult>[];
}

type Expected<TCaseField, TToolArgs = unknown, TToolResult = unknown> =
  ExpectedBase<TToolArgs, TToolResult> & {
    [key: string]: TCaseField;
  };

interface ToolCall<TToolArgs = unknown, TToolResult = unknown> {
  toolName: string;
  toolArgs: TToolArgs;
  toolResult: TToolResult;
};

interface EvaluatorOptions {
  expectedOutput: any;
  agentOutput: any;
}

export interface EvaluatorResult {
    id: string
    score: number // from 0 to 1 only
    passed: boolean
    reason?: string
    confidence?: number
}

export interface Metrics {
    score: {
        avg: number;
        min: number;             
        max: number;             
        passRate: number
    }
    latency: {
        avg: number;
        min: number;             // Fastest test
        max: number;             // Slowest test
        p50: number;             // Median
        p95: number;
        p99: number;             // Add: for outlier detection
        total: number;           // Total time for all tests
    };
    tokens: {
        total: number;
        avg: number;             // Add: per test
        min: number;
        max: number;
        byModel?: Record<string, number>;  // If using multiple models
    };
    cost: {
        total: number;           // Rename from totalCost
        avg: number;             // Rename from estimatedCost
        byModel?: Record<string, number>;
        breakdown?: {
        input: number;
        output: number;
        cached?: number;
        };
    };
    toolCalls?: {
        total: number;           // Rename from toolCallCount
        avg: number;             // Per test
        byTool: Record<string, number>;    // Which tools used most
        successRate: number;     // % of successful tool calls
    };
    execution: {
        totalTests: number;
        passed: number;
        failed: number;
        errored: number;          // Tests that threw errors
        errorLogs?: string[];
        skipped?: number;
        duration: number;        // Total execution time
    };
}

// utils

export type Result<TData, TError = unknown> =
  | { value: TData; error: null }
  | { value: null; error: TError };