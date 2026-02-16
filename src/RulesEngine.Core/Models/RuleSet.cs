using System.Text.Json.Serialization;

namespace RulesEngine.Core.Models;

/// <summary>
/// Represents a complete rule set definition.
/// A rule set contains metadata, default behavior,
/// and a collection of rules ordered by priority.
/// </summary>
public sealed class RuleSet
{
    /// <summary>
    /// Version of the rules engine specification.
    /// Allows future evolution of the contract.
    /// </summary>
    [JsonPropertyName("specVersion")]
    public string SpecVersion { get; init; } = "1.0";

    /// <summary>
    /// Logical name of the rule set.
    /// </summary>
    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Version of this specific rule set.
    /// Enables versioning and backward compatibility.
    /// </summary>
    [JsonPropertyName("version")]
    public string Version { get; init; } = "1.0.0";

    /// <summary>
    /// Default action executed when no rule matches.
    /// </summary>
    [JsonPropertyName("default")]
    public ThenAction Default { get; init; } = new();

    /// <summary>
    /// Collection of rules evaluated by the engine.
    /// Rules are typically evaluated in descending priority order.
    /// </summary>
    [JsonPropertyName("rules")]
    public List<Rule> Rules { get; init; } = new();
}