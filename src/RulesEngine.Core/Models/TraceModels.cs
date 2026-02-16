namespace RulesEngine.Core.Models;

/// <summary>
/// Represents the evaluation trace of a single rule.
/// </summary>
public sealed class RuleTrace
{
    /// <summary>
    /// Identifier of the evaluated rule.
    /// </summary>
    public string RuleId { get; init; } = string.Empty;

    /// <summary>
    /// Indicates whether the rule matched.
    /// </summary>
    public bool Matched { get; init; }

    /// <summary>
    /// List of evaluation steps performed.
    /// </summary>
    public List<EvalStep> Steps { get; init; } = new();
}

/// <summary>
/// Represents a single evaluation step inside a rule.
/// </summary>
public sealed class EvalStep
{
    /// <summary>
    /// Human-readable expression evaluated.
    /// Example: "score >= 680"
    /// </summary>
    public string Expr { get; init; } = string.Empty;

    /// <summary>
    /// Left-hand value evaluated.
    /// </summary>
    public string? Left { get; init; }

    /// <summary>
    /// Right-hand value evaluated.
    /// </summary>
    public string? Right { get; init; }

    /// <summary>
    /// Result of the evaluation step.
    /// </summary>
    public bool Result { get; init; }
}

/// <summary>
/// Represents an engine error during validation or evaluation.
/// </summary>
public sealed class EngineError
{
    /// <summary>
    /// Machine-readable error code.
    /// Example: "UNKNOWN_OPERATOR"
    /// </summary>
    public string Code { get; init; } = string.Empty;

    /// <summary>
    /// Human-readable error message.
    /// </summary>
    public string Message { get; init; } = string.Empty;

    /// <summary>
    /// Optional rule identifier related to the error.
    /// </summary>
    public string? RuleId { get; init; }
}