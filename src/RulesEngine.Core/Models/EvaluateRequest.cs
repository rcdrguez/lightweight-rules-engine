using System.Text.Json;

namespace RulesEngine.Core.Models;

/// <summary>
/// Represents an evaluation request.
/// Contains the RuleSet, input facts, and optional settings.
/// </summary>
public sealed class EvaluateRequest
{
    /// <summary>
    /// The RuleSet definition to evaluate.
    /// </summary>
    public required RuleSet RuleSet { get; init; }

    /// <summary>
    /// Input data ("facts") evaluated against the rules.
    /// Kept as JsonElement for maximum flexibility.
    /// </summary>
    public required JsonElement Facts { get; init; }

    /// <summary>
    /// Optional evaluation behavior configuration.
    /// </summary>
    public EvaluateOptions Options { get; init; } = new();
}