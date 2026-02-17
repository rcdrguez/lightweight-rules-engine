using System.Text.Json;
using RulesEngine.Core.Models;

namespace RulesEngine.Core.Validation;

/// <summary>
/// Performs structural validation of a RuleSet.
/// This validates the DSL shape and known operators before evaluation.
/// </summary>
public static class RuleSetValidator
{
    // Operators supported by the MVP engine.
    // Add more here as you extend the DSL.
    private static readonly HashSet<string> AllowedOperators = new(StringComparer.Ordinal)
    {
        "all", "any",
        "==", "!=", ">", ">=", "<", "<=",
        "var"
    };

    /// <summary>
    /// Validates a RuleSet definition and returns a list of errors.
    /// If the list is empty, the RuleSet is structurally valid.
    /// </summary>
    public static List<EngineError> Validate(RuleSet ruleSet)
    {
        var errors = new List<EngineError>();

        if (ruleSet is null)
        {
            errors.Add(new EngineError { Code = "INVALID_RULESET", Message = "RuleSet is null." });
            return errors;
        }

        if (string.IsNullOrWhiteSpace(ruleSet.SpecVersion))
            errors.Add(new EngineError { Code = "INVALID_RULESET", Message = "specVersion is required." });

        if (string.IsNullOrWhiteSpace(ruleSet.Name))
            errors.Add(new EngineError { Code = "INVALID_RULESET", Message = "name is required." });

        if (string.IsNullOrWhiteSpace(ruleSet.Version))
            errors.Add(new EngineError { Code = "INVALID_RULESET", Message = "version is required." });

        if (ruleSet.Rules is null || ruleSet.Rules.Count == 0)
        {
            errors.Add(new EngineError { Code = "INVALID_RULESET", Message = "rules must contain at least one rule." });
            return errors;
        }

        // Ensure rule IDs are unique.
        var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var rule in ruleSet.Rules)
        {
            if (rule is null)
            {
                errors.Add(new EngineError { Code = "INVALID_RULE", Message = "rule entry is null." });
                continue;
            }

            if (string.IsNullOrWhiteSpace(rule.Id))
            {
                errors.Add(new EngineError { Code = "INVALID_RULE", Message = "rule.id is required." });
                continue;
            }

            if (rule.Then is null)
            {
                errors.Add(new EngineError
                {
                    Code = "INVALID_RULE",
                    Message = "rule.then is required.",
                    RuleId = rule.Id
                });
            }

            if (!ids.Add(rule.Id))
            {
                errors.Add(new EngineError
                {
                    Code = "DUPLICATE_RULE_ID",
                    Message = $"Duplicate rule id: {rule.Id}",
                    RuleId = rule.Id
                });
            }

            if (rule.When.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            {
                errors.Add(new EngineError
                {
                    Code = "INVALID_RULE",
                    Message = "rule.when is required.",
                    RuleId = rule.Id
                });
                continue;
            }

            if (rule.When.ValueKind != JsonValueKind.Object)
            {
                errors.Add(new EngineError
                {
                    Code = "INVALID_EXPR",
                    Message = "rule.when must be a JSON object.",
                    RuleId = rule.Id
                });
                continue;
            }

            ValidateExpression(rule.When, rule.Id, errors);
        }

        return errors;
    }

    /// <summary>
    /// Validates a DSL expression recursively.
    /// The expression is expected to be a JSON object with a single operator.
    /// </summary>
    private static void ValidateExpression(JsonElement expr, string ruleId, List<EngineError> errors)
    {
        if (expr.ValueKind != JsonValueKind.Object)
        {
            errors.Add(new EngineError { Code = "INVALID_EXPR", Message = "Expression must be a JSON object.", RuleId = ruleId });
            return;
        }

        // Expect exactly one operator at the top-level.
        var props = expr.EnumerateObject().ToList();
        if (props.Count != 1)
        {
            errors.Add(new EngineError
            {
                Code = "INVALID_EXPR",
                Message = "Expression object must contain exactly one operator.",
                RuleId = ruleId
            });
            return;
        }

        var op = props[0].Name;
        var value = props[0].Value;

        if (!AllowedOperators.Contains(op))
        {
            errors.Add(new EngineError { Code = "UNKNOWN_OPERATOR", Message = $"Unknown operator: {op}", RuleId = ruleId });
            return;
        }

        // Boolean groups: all/any -> array of expressions
        if (op is "all" or "any")
        {
            if (value.ValueKind != JsonValueKind.Array)
            {
                errors.Add(new EngineError { Code = "INVALID_EXPR", Message = $"{op} must be an array.", RuleId = ruleId });
                return;
            }

            foreach (var child in value.EnumerateArray())
                ValidateExpression(child, ruleId, errors);

            return;
        }

        // Variable reference: { "var": "path.to.value" }
        if (op == "var")
        {
            if (value.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(value.GetString()))
            {
                errors.Add(new EngineError { Code = "INVALID_VAR", Message = "var must be a non-empty string path.", RuleId = ruleId });
            }
            return;
        }

        // Comparators: { ">=": [left, right] } -> array length 2
        if (value.ValueKind != JsonValueKind.Array || value.GetArrayLength() != 2)
        {
            errors.Add(new EngineError
            {
                Code = "INVALID_EXPR",
                Message = $"{op} must be an array with exactly 2 items.",
                RuleId = ruleId
            });
            return;
        }

        // Left and right can be literals or nested expressions (e.g., var).
        var left = value[0];
        var right = value[1];

        if (left.ValueKind == JsonValueKind.Object) ValidateExpression(left, ruleId, errors);
        if (right.ValueKind == JsonValueKind.Object) ValidateExpression(right, ruleId, errors);
    }
}
