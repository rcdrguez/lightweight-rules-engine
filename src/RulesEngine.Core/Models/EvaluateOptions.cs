namespace RulesEngine.Core.Models;

/// <summary>
/// Optional settings that control evaluation behavior.
/// </summary>
public sealed class EvaluateOptions
{
    /// <summary>
    /// When true, the engine generates a detailed trace
    /// explaining how each rule was evaluated.
    /// </summary>
    public bool Explain { get; init; } = false;

    /// <summary>
    /// When true, missing variables will produce errors.
    /// When false, missing variables are treated as null/false.
    /// Recommended default: true (strict mode).
    /// </summary>
    public bool StrictMode { get; init; } = true;
}