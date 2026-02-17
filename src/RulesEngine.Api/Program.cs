using System.Text.Json;
using RulesEngine.Core.Engine;
using RulesEngine.Core.Models;
using RulesEngine.Core.Validation;

var builder = WebApplication.CreateBuilder(args);

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS for the web playground (MVP: allow all; restrict later)
builder.Services.AddCors(options =>
{
    options.AddPolicy("playground", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("playground");

// Swagger UI
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "RulesEngine.Api v1");
});

// Basic health endpoint
app.MapGet("/", () => Results.Ok(new { status = "ok", service = "RulesEngine.Api" }));

/// <summary>
/// Validates a RuleSet structure.
/// Body: RuleSet JSON
/// </summary>
app.MapPost("/validate", (RuleSet ruleset) =>
{
    var errors = RuleSetValidator.Validate(ruleset);
    return Results.Ok(new { errors });
});

/// <summary>
/// Evaluates a ruleset against facts.
/// Body: { ruleset, facts, options }
/// </summary>
app.MapPost("/evaluate", (EvaluateHttpRequest req) =>
{
    // Basic request validation
    if (req.Ruleset is null)
        return Results.BadRequest(new { errors = new[] { new { code = "INVALID_REQUEST", message = "ruleset is required" } } });

    if (req.Facts.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
        return Results.BadRequest(new { errors = new[] { new { code = "INVALID_REQUEST", message = "facts is required" } } });

    // Validate RuleSet first
    var validationErrors = RuleSetValidator.Validate(req.Ruleset);
    if (validationErrors.Count > 0)
        return Results.Ok(new { errors = validationErrors });

    // Evaluate
    var result = RulesEvaluator.Evaluate(new EvaluateRequest
    {
        RuleSet = req.Ruleset,
        Facts = req.Facts,
        Options = req.Options ?? new EvaluateOptions()
    });

    return Results.Ok(result);
});

app.Run();

/// <summary>
/// HTTP request contract for /evaluate.
/// </summary>
public sealed class EvaluateHttpRequest
{
    public RuleSet? Ruleset { get; set; }
    public JsonElement Facts { get; set; }
    public EvaluateOptions? Options { get; set; }
}
