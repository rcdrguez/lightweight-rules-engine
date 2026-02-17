using System.Globalization;
using System.Text.Json;
using RulesEngine.Core.Models;

namespace RulesEngine.Core.Engine;

/// <summary>
/// Evaluates a RuleSet against input facts.
/// - Rules are evaluated in descending priority order.
/// - First matching rule wins (winner-takes-all).
/// - Optional Explain mode produces a detailed trace.
/// </summary>
public static class RulesEvaluator
{
    /// <summary>
    /// Evaluates the given request and returns the evaluation result.
    /// </summary>
    public static EvaluateResult Evaluate(EvaluateRequest request)
    {
        var result = new EvaluateResult();

        if (request is null)
        {
            result.Errors.Add(new EngineError { Code = "INVALID_REQUEST", Message = "Request is null." });
            return result;
        }

        if (request.RuleSet is null)
        {
            result.Errors.Add(new EngineError { Code = "INVALID_REQUEST", Message = "RuleSet is null." });
            return result;
        }

        if (request.RuleSet.Rules is null)
        {
            result.Errors.Add(new EngineError { Code = "INVALID_RULESET", Message = "Rules collection is null." });
            return result;
        }

        // Evaluate higher priority rules first.
        var orderedRules = request.RuleSet.Rules
            .OrderByDescending(r => r.Priority)
            .ToList();

        foreach (var rule in orderedRules)
        {
            if (rule is null)
            {
                result.Errors.Add(new EngineError { Code = "INVALID_RULE", Message = "Rule entry is null." });
                continue;
            }

            var trace = new RuleTrace { RuleId = rule.Id };

            // Evaluate the "when" expression for this rule.
            var matched = TryEvaluateExpression(
                expr: rule.When,
                facts: request.Facts,
                options: request.Options,
                trace: trace,
                errors: result.Errors,
                ruleId: rule.Id
            );

            // Record match result.
            trace = new RuleTrace
            {
                RuleId = trace.RuleId,
                Matched = matched,
                Steps = trace.Steps
            };

            if (request.Options.Explain)
                result.Trace.Add(trace);

            if (!matched)
                continue;

            // Rule matched -> apply actions and return (winner takes all).
            result.MatchedRules.Add(rule.Id);

            ApplyThen(rule.Then, result);

            return result;
        }

        // No rules matched -> apply default action.
        ApplyThen(request.RuleSet.Default, result);

        return result;
    }

    /// <summary>
    /// Applies a ThenAction to the evaluation result.
    /// </summary>
    private static void ApplyThen(ThenAction? then, EvaluateResult result)
    {
        if (then is null)
            return;

        foreach (var kv in then.Set ?? new Dictionary<string, object?>())
            result.Output[kv.Key] = NormalizeSetValue(kv.Value);

        foreach (var tag in then.AddTags ?? new List<string>())
            result.Tags.Add(tag);
    }

    /// <summary>
    /// Converts System.Text.Json values (JsonElement) into .NET primitives
    /// so consumers and tests can compare values predictably.
    /// </summary>
    private static object? NormalizeSetValue(object? value)
    {
        if (value is null) return null;

        if (value is JsonElement je)
        {
            return je.ValueKind switch
            {
                JsonValueKind.String => je.GetString(),
                JsonValueKind.Number => je.TryGetInt64(out var i) ? i : je.GetDouble(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Null => null,
                // For objects/arrays, keep the raw JSON text for now (MVP).
                JsonValueKind.Object => je.GetRawText(),
                JsonValueKind.Array => je.GetRawText(),
                _ => je.ToString()
            };
        }

        return value;
    }

    /// <summary>
    /// Evaluates an expression recursively.
    /// Supported forms:
    /// - { "all": [expr, expr, ...] }
    /// - { "any": [expr, expr, ...] }
    /// - { "==": [left, right] } (and other comparators)
    /// - { "var": "path.to.value" } (only as a value inside comparators)
    /// </summary>
    private static bool TryEvaluateExpression(
        JsonElement expr,
        JsonElement facts,
        EvaluateOptions options,
        RuleTrace trace,
        List<EngineError> errors,
        string ruleId)
    {
        if (expr.ValueKind != JsonValueKind.Object)
        {
            errors.Add(new EngineError { Code = "INVALID_EXPR", Message = "Expression must be a JSON object.", RuleId = ruleId });
            return false;
        }

        var props = expr.EnumerateObject().ToList();
        if (props.Count != 1)
        {
            errors.Add(new EngineError { Code = "INVALID_EXPR", Message = "Expression must contain exactly one operator.", RuleId = ruleId });
            return false;
        }

        var op = props[0].Name;
        var value = props[0].Value;

        // all: logical AND over child expressions (short-circuit)
        if (op == "all")
        {
            if (value.ValueKind != JsonValueKind.Array)
            {
                errors.Add(new EngineError { Code = "INVALID_EXPR", Message = "all must be an array.", RuleId = ruleId });
                return false;
            }

            foreach (var child in value.EnumerateArray())
            {
                var ok = TryEvaluateExpression(child, facts, options, trace, errors, ruleId);
                if (!ok) return false;
            }
            return true;
        }

        // any: logical OR over child expressions (short-circuit)
        if (op == "any")
        {
            if (value.ValueKind != JsonValueKind.Array)
            {
                errors.Add(new EngineError { Code = "INVALID_EXPR", Message = "any must be an array.", RuleId = ruleId });
                return false;
            }

            foreach (var child in value.EnumerateArray())
            {
                var ok = TryEvaluateExpression(child, facts, options, trace, errors, ruleId);
                if (ok) return true;
            }
            return false;
        }

        // var must not appear alone as a full boolean expression in this MVP.
        if (op == "var")
        {
            errors.Add(new EngineError { Code = "INVALID_EXPR", Message = "var cannot be evaluated as a standalone boolean expression.", RuleId = ruleId });
            return false;
        }

        // Comparators: expect [left, right]
        if (value.ValueKind != JsonValueKind.Array || value.GetArrayLength() != 2)
        {
            errors.Add(new EngineError { Code = "INVALID_EXPR", Message = $"{op} must be an array with exactly 2 items.", RuleId = ruleId });
            return false;
        }

        var leftNode = value[0];
        var rightNode = value[1];

        var left = ResolveValue(leftNode, facts, options, errors, ruleId);
        var right = ResolveValue(rightNode, facts, options, errors, ruleId);

        // If we couldn't resolve values (e.g., missing vars in strict mode), treat as false.
        if (left is UnresolvedValue || right is UnresolvedValue)
            return false;

        var comparison = Compare(op, left, right);

        if (options.Explain)
        {
            trace.Steps.Add(new EvalStep
            {
                Expr = $"{ToDebugString(left)} {op} {ToDebugString(right)}",
                Left = ToDebugString(left),
                Right = ToDebugString(right),
                Result = comparison
            });
        }

        return comparison;
    }

    /// <summary>
    /// Resolves a DSL node into a runtime value.
    /// Supports literals and { "var": "path.to.value" }.
    /// </summary>
    private static object ResolveValue(
        JsonElement node,
        JsonElement facts,
        EvaluateOptions options,
        List<EngineError> errors,
        string ruleId)
    {
        // Nested object expression
        if (node.ValueKind == JsonValueKind.Object)
        {
            var props = node.EnumerateObject().ToList();
            if (props.Count != 1)
            {
                errors.Add(new EngineError { Code = "INVALID_EXPR", Message = "Value expression must contain exactly one operator.", RuleId = ruleId });
                return UnresolvedValue.Instance;
            }

            var op = props[0].Name;
            var value = props[0].Value;

            if (op != "var")
            {
                errors.Add(new EngineError { Code = "INVALID_EXPR", Message = "Only {\"var\": \"path\"} is supported as a value expression in this MVP.", RuleId = ruleId });
                return UnresolvedValue.Instance;
            }

            if (value.ValueKind != JsonValueKind.String)
            {
                errors.Add(new EngineError { Code = "INVALID_VAR", Message = "var must be a string path.", RuleId = ruleId });
                return UnresolvedValue.Instance;
            }

            var path = value.GetString() ?? string.Empty;

            if (!TryGetByPath(facts, path, out var resolved))
            {
                if (options.StrictMode)
                {
                    errors.Add(new EngineError { Code = "VAR_NOT_FOUND", Message = $"Variable not found: {path}", RuleId = ruleId });
                    return UnresolvedValue.Instance;
                }

                // Non-strict mode: missing variables become null.
                return null!;
            }

            return resolved!;
        }

        // Literal value
        return node.ValueKind switch
        {
            JsonValueKind.String => node.GetString()!,
            JsonValueKind.Number => node.TryGetInt64(out var i) ? i : node.GetDouble(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null!,
            _ => node.ToString()
        };
    }

    /// <summary>
    /// Tries to resolve a dot-separated path from a JsonElement object.
    /// Example path: "user.age"
    /// </summary>
    private static bool TryGetByPath(JsonElement root, string path, out object? value)
    {
        value = null;

        if (string.IsNullOrWhiteSpace(path))
            return false;

        var current = root;

        foreach (var part in path.Split('.', StringSplitOptions.RemoveEmptyEntries))
        {
            if (current.ValueKind != JsonValueKind.Object)
                return false;

            if (!current.TryGetProperty(part, out current))
                return false;
        }

        value = current.ValueKind switch
        {
            JsonValueKind.String => current.GetString(),
            JsonValueKind.Number => current.TryGetInt64(out var i) ? i : current.GetDouble(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null,
            _ => current.ToString()
        };

        return true;
    }

    /// <summary>
    /// Performs a comparison between two values using a DSL operator.
    /// Numeric comparisons use decimal to reduce floating point issues (MVP).
    /// Non-numeric types support only == and != (MVP).
    /// </summary>
    private static bool Compare(string op, object? left, object? right)
    {
        // Handle nulls for equality/inequality.
        if (left is null || right is null)
        {
            return op switch
            {
                "==" => left is null && right is null,
                "!=" => !(left is null && right is null),
                _ => false
            };
        }

        // Numeric comparison if both can be converted.
        if (TryToDecimal(left, out var ldec) && TryToDecimal(right, out var rdec))
        {
            return op switch
            {
                "==" => ldec == rdec,
                "!=" => ldec != rdec,
                ">" => ldec > rdec,
                ">=" => ldec >= rdec,
                "<" => ldec < rdec,
                "<=" => ldec <= rdec,
                _ => false
            };
        }

        // Fallback: only equality/inequality for non-numeric types (MVP).
        return op switch
        {
            "==" => Equals(left, right),
            "!=" => !Equals(left, right),
            _ => false
        };
    }

    /// <summary>
    /// Converts common numeric types to decimal.
    /// </summary>
    private static bool TryToDecimal(object value, out decimal dec)
    {
        dec = 0m;

        return value switch
        {
            int i => (dec = i) == i,
            long l => (dec = l) == l,
            double d => decimal.TryParse(d.ToString(CultureInfo.InvariantCulture), NumberStyles.Any, CultureInfo.InvariantCulture, out dec),
            float f => decimal.TryParse(f.ToString(CultureInfo.InvariantCulture), NumberStyles.Any, CultureInfo.InvariantCulture, out dec),
            decimal m => (dec = m) == m,
            string s => decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out dec),
            _ => false
        };
    }

    /// <summary>
    /// Small helper to render debug output consistently.
    /// </summary>
    private static string ToDebugString(object? value) => value is null ? "null" : value.ToString() ?? string.Empty;

    /// <summary>
    /// Marker value used when resolution fails in strict mode.
    /// </summary>
    private sealed class UnresolvedValue
    {
        public static readonly UnresolvedValue Instance = new();
        private UnresolvedValue() { }
    }
}
