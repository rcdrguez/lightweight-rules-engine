namespace RulesEngine.Core.Models;

/// <summary>
/// Represents the result of a rule evaluation.
/// </summary>
public sealed class EvaluateResult
{
    /// <summary>
    /// Final output produced by the engine.
    /// Contains merged results from the matched rule
    /// or the default action.
    /// </summary>
    public Dictionary<string, object?> Output { get; init; } = new();

    /// <summary>
    /// List of rule IDs that matched during evaluation.
    /// </summary>
    public List<string> MatchedRules { get; init; } = new();

    /// <summary>
    /// Tags collected from matching rules.
    /// </summary>
    public List<string> Tags { get; init; } = new();

    /// <summary>
    /// Detailed evaluation trace (if Explain mode is enabled).
    /// </summary>
    public List<RuleTrace> Trace { get; init; } = new();

    /// <summary>
    /// Errors detected during validation or evaluation.
    /// </summary>
    public List<EngineError> Errors { get; init; } = new();
}