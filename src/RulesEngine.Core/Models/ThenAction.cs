using System.Text.Json.Serialization;

namespace RulesEngine.Core.Models;

/// <summary>
/// Represents the action executed when a rule matches.
/// The engine applies these changes to the final output.
/// </summary>
public sealed class ThenAction
{
    /// <summary>
    /// Key-value pairs added or updated in the final output.
    /// Example:
    /// { "decision": "APPROVE" }
    /// </summary>
    [JsonPropertyName("set")]
    public Dictionary<string, object?> Set { get; init; } = new();

    /// <summary>
    /// Optional tags that provide additional metadata
    /// about the rule result (e.g., "HIGH_RISK", "LOW_RISK").
    /// </summary>
    [JsonPropertyName("addTags")]
    public List<string> AddTags { get; init; } = new();
}