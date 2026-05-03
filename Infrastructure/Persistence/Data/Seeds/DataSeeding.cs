using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Persistence.Data.Seeds
{
    public class DataSeeding(ApplicationDbContext _dbContext)
    {
        public async Task SeedAsync()
        {
            try
            {
                if ((await _dbContext.Database.GetPendingMigrationsAsync()).Any())
                {
                    await _dbContext.Database.MigrateAsync();
                }

                // List of topic seed files
                var topicSeedFiles = new[]
                {
                    "categories.json",
                    "array.json",
                    "binary-search.json",
                    "linked-list.json",
                    "bubble-sort.json",
                    "insertion-sort.json",
                    "selection-sort.json",
                    "quick-sort.json",
                    "stack.json",
                    "queue.json",
                    "binary-tree.json",
                    "binary-search-tree.json",
                    "dfs.json",
                    "bfs.json"
                };

                foreach (var fileName in topicSeedFiles)
                {
                    var path = Path.Combine(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics", fileName);
                    if (!File.Exists(path)) continue;

                    using var stream = File.OpenRead(path);
                    if (fileName == "categories.json")
                    {
                        var categories = await JsonSerializer.DeserializeAsync<List<Category>>(stream, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        if (categories != null)
                        {
                            foreach (var cat in categories)
                            {
                                var existing = await _dbContext.Categories.FirstOrDefaultAsync(c => c.Name == cat.Name);
                                if (existing == null) await _dbContext.Categories.AddAsync(cat);
                            }
                        }
                    }
                    else
                    {
                        var topic = await JsonSerializer.DeserializeAsync<Topic>(stream, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        if (topic != null)
                        {
                            var existing = await _dbContext.Topics.Include(t => t.CodeImplementations).Include(t => t.Complexities)
                                .FirstOrDefaultAsync(t => t.Slug == topic.Slug);
                            
                            if (existing != null)
                            {
                                Console.WriteLine($"[SEEDING] Updating existing topic: {topic.Title}");
                                // Update existing topic
                                existing.Title = topic.Title;
                                existing.Description = topic.Description;
                                existing.Explanation = topic.Explanation;
                                existing.Difficulty = topic.Difficulty;
                                
                                // Explicitly remove and re-add to ensure refresh
                                foreach(var impl in existing.CodeImplementations.ToList()) 
                                    _dbContext.TopicCodeImplementations.Remove(impl);
                                
                                foreach(var comp in existing.Complexities.ToList()) 
                                    _dbContext.TopicComplexities.Remove(comp);

                                existing.CodeImplementations = topic.CodeImplementations;
                                existing.Complexities = topic.Complexities;
                            }
                            else
                            {
                                Console.WriteLine($"[SEEDING] Adding new topic: {topic.Title}");
                                await _dbContext.Topics.AddAsync(topic);
                            }
                        }
                    }
                }

                await _dbContext.SaveChangesAsync();



                if (!_dbContext.Problems.Any())
                {
                    var problemFiles = new[]
                    {
                        @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Problems\Graph\bfs-traversal-order.json",
                        @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Problems\Graph\count-connected-components.json",
                        @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Problems\Graph\detect-cycle-in-undirected-graph.json",
                        @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Problems\Graph\dfs-traversal-order.json",
                        @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Problems\Graph\level-of-each-node.json",
                        @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Problems\Graph\shortest-path-unweighted-graph.json"
                    };

                    foreach (var filePath in problemFiles)
                    {
                        var stream = File.OpenRead(filePath);
                        var problem = await JsonSerializer.DeserializeAsync<Problem>(stream,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        if (problem is not null)
                            await _dbContext.Problems.AddAsync(problem);
                    }

                    await _dbContext.SaveChangesAsync();
                }

            }
            catch (Exception)
            {
                Console.WriteLine("something went wrong while seeding data to database.");
            }
        }
    }
}
