using System.Text.Json;

namespace RulesEngine.Core.Tests.TestHelpers;

/// <summary>
/// Helper methods to load JSON test assets from the output folder.
/// </summary>
public static class JsonTestLoader
{
    public static string ReadText(string relativePath)
    {
        // Tests run from the output folder (bin/Debug/...),
        // so we copy TestData into the output to make file access stable.
        var fullPath = Path.Combine(AppContext.BaseDirectory, relativePath);
        return File.ReadAllText(fullPath);
    }

    public static T ReadJson<T>(string relativePath)
    {
        var json = ReadText(relativePath);
        var obj = JsonSerializer.Deserialize<T>(json);
        if (obj is null)
            throw new InvalidOperationException($"Failed to deserialize JSON from '{relativePath}'.");
        return obj;
    }

    public static JsonDocument ReadJsonDocument(string relativePath)
    {
        var json = ReadText(relativePath);
        return JsonDocument.Parse(json);
    }
}