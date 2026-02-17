using System.Text.Json;
using RulesEngine.Core.Engine;
using RulesEngine.Core.Models;
using RulesEngine.Core.Tests.TestHelpers;
using RulesEngine.Core.Validation;
using Xunit;

namespace RulesEngine.Core.Tests;

/// <summary>
/// End-to-end tests that validate the rules engine behavior
/// using real JSON RuleSets and Facts.
/// </summary>
public class RulesEvaluatorTests
{
    [Fact]
    public void Should_Approve_Good_Applicant()
    {
        // Arrange
        var ruleset = JsonTestLoader.ReadJson<RuleSet>("TestData/loan.rules.json");
        var validationErrors = RuleSetValidator.Validate(ruleset);
        Assert.Empty(validationErrors);

        using var factsDoc = JsonTestLoader.ReadJsonDocument("TestData/loan.approve.facts.json");

        var request = new EvaluateRequest
        {
            RuleSet = ruleset,
            Facts = factsDoc.RootElement,
            Options = new EvaluateOptions { Explain = true, StrictMode = true }
        };

        // Act
        var res = RulesEvaluator.Evaluate(request);

        // Assert
        Assert.Empty(res.Errors);
        Assert.Contains("R-APPROVE-GOOD", res.MatchedRules);
        Assert.Equal("APPROVE", res.Output["decision"]);
        Assert.Contains("LOW_RISK", res.Tags);
        Assert.NotEmpty(res.Trace);
    }

    [Fact]
    public void Should_Reject_Low_Score()
    {
        // Arrange
        var ruleset = JsonTestLoader.ReadJson<RuleSet>("TestData/loan.rules.json");
        var validationErrors = RuleSetValidator.Validate(ruleset);
        Assert.Empty(validationErrors);

        using var factsDoc = JsonTestLoader.ReadJsonDocument("TestData/loan.reject.facts.json");

        var request = new EvaluateRequest
        {
            RuleSet = ruleset,
            Facts = factsDoc.RootElement,
            Options = new EvaluateOptions { Explain = true, StrictMode = true }
        };

        // Act
        var res = RulesEvaluator.Evaluate(request);

        // Assert
        Assert.Empty(res.Errors);
        Assert.Contains("R-REJECT-LOW-SCORE", res.MatchedRules);
        Assert.Equal("REJECT", res.Output["decision"]);
        Assert.Contains("HIGH_RISK", res.Tags);
        Assert.NotEmpty(res.Trace);
    }

    [Fact]
    public void Should_Not_Throw_When_Then_Collections_Are_Null()
    {
        var ruleSet = new RuleSet
        {
            Name = "null-safe",
            Version = "1.0.0",
            Rules =
            [
                new Rule
                {
                    Id = "R1",
                    Priority = 1,
                    When = JsonDocument.Parse("{ \"==\": [1, 1] }").RootElement,
                    Then = new ThenAction
                    {
                        Set = null!,
                        AddTags = null!
                    }
                }
            ]
        };

        using var facts = JsonDocument.Parse("{}");
        var request = new EvaluateRequest { RuleSet = ruleSet, Facts = facts.RootElement, Options = new EvaluateOptions() };

        var res = RulesEvaluator.Evaluate(request);

        Assert.Empty(res.Errors);
        Assert.Empty(res.Output);
        Assert.Empty(res.Tags);
        Assert.Contains("R1", res.MatchedRules);
    }

    [Fact]
    public void Should_Return_Error_When_Request_Is_Null()
    {
        var result = RulesEvaluator.Evaluate(null!);

        Assert.Contains(result.Errors, e => e.Code == "INVALID_REQUEST" && e.Message == "Request is null.");
    }
}
