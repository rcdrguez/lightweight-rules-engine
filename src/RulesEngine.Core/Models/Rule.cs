using System.Text.Json;
using System.Text.Json.Serialization;

namespace RulesEngine.Core.Models;

/// <summary>
/// Represents a single rule inside a RuleSet.
/// Each rule contains an identifier, priority,
/// a condition ("when") and an action ("then").
/// </summary>
public sealed class Rule
{
    /// <summary>
    /// Unique identifier of the rule.
    /// Must be unique within a RuleSet.
    /// </summary>
    [JsonPropertyName("id")]
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Priority used to resolve conflicts.
    /// Higher values are evaluated first.
    /// </summary>
    [JsonPropertyName("priority")]
    public int Priority { get; init; }

    /// <summary>
    /// The conditional expression that determines
    /// whether the rule matches.
    /// 
    /// Stored as JsonElement to keep the DSL flexible
    /// and language-agnostic.
    /// </summary>
    [JsonPropertyName("when")]
    public JsonElement When { get; init; }

    /// <summary>
    /// Action executed if the rule condition evaluates to true.
    /// </summary>
    [JsonPropertyName("then")]
    public ThenAction Then { get; init; } = new();
}