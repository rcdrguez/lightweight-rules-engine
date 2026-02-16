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
}