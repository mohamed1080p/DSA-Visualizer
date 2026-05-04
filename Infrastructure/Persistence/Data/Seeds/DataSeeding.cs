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
                if (_dbContext.Database.IsSqlite())
                {
                    await _dbContext.Database.EnsureDeletedAsync();
                    await _dbContext.Database.EnsureCreatedAsync();
                }
                else if ((await _dbContext.Database.GetPendingMigrationsAsync()).Any())
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



                var problemsPath = @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Problems";
                if (Directory.Exists(problemsPath))
                {
                    var problemFiles = Directory.GetFiles(problemsPath, "*.json", SearchOption.AllDirectories);
                    foreach (var filePath in problemFiles)
                    {
                        using var stream = File.OpenRead(filePath);
                        var problem = await JsonSerializer.DeserializeAsync<Problem>(stream,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                            
                        if (problem is not null)
                        {
                            var existing = await _dbContext.Problems.FirstOrDefaultAsync(p => p.Title == problem.Title);
                            if (existing == null)
                            {
                                if (string.IsNullOrWhiteSpace(problem.Slug))
                                {
                                    problem.Slug = problem.Title.ToLower().Replace(" ", "-");
                                }
                                Console.WriteLine($"[SEEDING] Adding new problem: {problem.Title}");
                                await _dbContext.Problems.AddAsync(problem);
                            }
                        }
                    }
                    await _dbContext.SaveChangesAsync();
                }

                // Seed Learning Paths
                if (!_dbContext.LearningPaths.Any())
                {
                    Console.WriteLine("[SEEDING] Adding Learning Paths...");
                    var allProblems = await _dbContext.Problems.ToListAsync();
                    var allTopics = await _dbContext.Topics.ToListAsync();

                    var paths = new List<Domain.Models.LearningPathModule.LearningPath>();

                    // Path 1: DSA Fundamentals
                    var dsaPath = new Domain.Models.LearningPathModule.LearningPath
                    {
                        Title = "Data Structures & Algorithms",
                        Slug = "dsa-fundamentals",
                        Description = "Master the core data structures and algorithms from arrays to graphs.",
                        Icon = "code",
                        Order = 1,
                        Levels = new List<Domain.Models.LearningPathModule.LearningPathLevel>()
                    };
                    var dsaPairs = new List<(string Topic, string Problem)>
                    {
                        ("array", "count-even-numbers"),
                        ("linked-list", "find-target-element"),
                        ("stack", "reverse-an-array"),
                        ("queue", "second-largest-element"),
                        ("binary-search", "binary-search-problem"),
                        ("bubble-sort", ""),
                        ("selection-sort", ""),
                        ("insertion-sort", "")
                    };
                    
                    int order = 1;
                    foreach (var pair in dsaPairs)
                    {
                        var topic = allTopics.FirstOrDefault(t => t.Slug == pair.Topic);
                        if (topic != null)
                        {
                            dsaPath.Levels.Add(new Domain.Models.LearningPathModule.LearningPathLevel
                            {
                                Title = topic.Title, Order = order++, TopicId = topic.Id
                            });
                        }
                        
                        if (!string.IsNullOrEmpty(pair.Problem))
                        {
                            var problem = allProblems.FirstOrDefault(p => p.Slug == pair.Problem);
                            if (problem != null)
                            {
                                dsaPath.Levels.Add(new Domain.Models.LearningPathModule.LearningPathLevel
                                {
                                    Title = problem.Title, Order = order++, ProblemId = problem.Id
                                });
                            }
                        }
                    }
                    paths.Add(dsaPath);

                    // Path 2: Array Mastery
                    var arrayPath = new Domain.Models.LearningPathModule.LearningPath
                    {
                        Title = "Array Mastery",
                        Slug = "array-mastery",
                        Description = "Deep dive into array problems from easy to hard.",
                        Icon = "layers",
                        Order = 2,
                        Levels = new List<Domain.Models.LearningPathModule.LearningPathLevel>()
                    };
                    var arrayTopic = allTopics.FirstOrDefault(t => t.Slug == "array");
                    if (arrayTopic != null)
                    {
                        arrayPath.Levels.Add(new Domain.Models.LearningPathModule.LearningPathLevel
                        {
                            Title = "Learn Arrays", Order = 1, TopicId = arrayTopic.Id
                        });
                    }
                    var arrayProblems = allProblems.Where(p => p.Topic?.Slug == "array" || p.TopicId == (arrayTopic?.Id ?? 0)).ToList();
                    int ao = 2;
                    foreach (var p in arrayProblems.Take(8))
                    {
                        arrayPath.Levels.Add(new Domain.Models.LearningPathModule.LearningPathLevel
                        {
                            Title = p.Title, Order = ao++, ProblemId = p.Id
                        });
                    }
                    paths.Add(arrayPath);

                    // Path 3: Sorting & Searching
                    var sortPath = new Domain.Models.LearningPathModule.LearningPath
                    {
                        Title = "Sorting & Searching",
                        Slug = "sorting-searching",
                        Description = "Learn all major sorting algorithms and searching techniques.",
                        Icon = "search",
                        Order = 3,
                        Levels = new List<Domain.Models.LearningPathModule.LearningPathLevel>()
                    };
                    var sortTopicSlugs = new[] { "bubble-sort", "selection-sort", "insertion-sort", "binary-search" };
                    int so = 1;
                    foreach (var slug in sortTopicSlugs)
                    {
                        var topic = allTopics.FirstOrDefault(t => t.Slug == slug);
                        if (topic != null)
                        {
                            sortPath.Levels.Add(new Domain.Models.LearningPathModule.LearningPathLevel
                            {
                                Title = topic.Title, Order = so++, TopicId = topic.Id
                            });
                        }
                    }
                    paths.Add(sortPath);

                    await _dbContext.LearningPaths.AddRangeAsync(paths);
                    await _dbContext.SaveChangesAsync();
                    Console.WriteLine($"[SEEDING] Added {paths.Count} learning paths.");
                }

            }
            catch (Exception)
            {
                Console.WriteLine("something went wrong while seeding data to database.");
            }
        }
    }
}
