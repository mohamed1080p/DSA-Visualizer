using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Domain.Models.IdentityModule;
using System.Text.Json;

namespace Infrastructure.Persistence.Data.Seeds
{
    public class DataSeeding(ApplicationDbContext _dbContext, ILogger<DataSeeding> _logger)
    {
        private const string TopicsSeedPath = @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics";
        private const string ProblemsSeedPath = @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Problems";
        public async Task SeedAsync()
        {
            try
            {
                if ((await _dbContext.Database.GetPendingMigrationsAsync()).Any())
                {
                    await _dbContext.Database.MigrateAsync();
                }

                await SeedTopicsAndCategoriesAsync();
                await SeedProblemsAsync();
                await SeedLearningPathsAsync();
                await SeedBotUserAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database seeding failed.");
                throw;
            }
        }

        private async Task SeedBotUserAsync()
        {
            var botId = "bot-opponent";
            var existingBot = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == botId);
            if (existingBot == null)
            {
                _logger.LogInformation("Seeding AI Challenger bot user.");
                var botUser = new ApplicationUser
                {
                    Id = botId,
                    UserName = "aichallenger",
                    NormalizedUserName = "AICHALLENGER",
                    Email = "bot@algoscope.local",
                    NormalizedEmail = "BOT@ALGOSCOPE.LOCAL",
                    DisplayName = "AI Challenger",
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow,
                    IsActive = true,
                    EmailConfirmed = true
                };
                await _dbContext.Users.AddAsync(botUser);
                await _dbContext.SaveChangesAsync();

                var botStats = new Domain.Models.BattleModule.PlayerStats
                {
                    UserId = botId,
                    RankPoints = 1200,
                    Level = 2,
                    WinCount = 50,
                    LossCount = 10,
                    CurrentStreak = 5,
                    BestStreak = 12
                };
                await _dbContext.PlayerStats.AddAsync(botStats);
                await _dbContext.SaveChangesAsync();
            }
        }

        private async Task SeedTopicsAndCategoriesAsync()
        {
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
                var path = Path.Combine(TopicsSeedPath, fileName);
                if (!File.Exists(path)) continue;

                using var stream = File.OpenRead(path);
                if (fileName == "categories.json")
                {
                    var categories = await JsonSerializer.DeserializeAsync<List<Category>>(stream, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
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
                    var topic = await JsonSerializer.DeserializeAsync<Topic>(stream, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    if (topic != null)
                        await UpsertTopicAsync(topic);
                }
            }

            await _dbContext.SaveChangesAsync();
        }

        private async Task UpsertTopicAsync(Topic topic)
        {
            var existing = await _dbContext.Topics.Include(t => t.CodeImplementations).Include(t => t.Complexities)
                .FirstOrDefaultAsync(t => t.Slug == topic.Slug);

            if (existing != null)
            {
                _logger.LogInformation("Updating seeded topic. TopicSlug={TopicSlug} TopicTitle={TopicTitle}", topic.Slug, topic.Title);
                existing.Title = topic.Title;
                existing.Description = topic.Description;
                existing.Explanation = topic.Explanation;
                existing.Difficulty = topic.Difficulty;

                foreach (var impl in existing.CodeImplementations.ToList())
                    _dbContext.TopicCodeImplementations.Remove(impl);

                foreach (var comp in existing.Complexities.ToList())
                    _dbContext.TopicComplexities.Remove(comp);

                existing.CodeImplementations = topic.CodeImplementations;
                existing.Complexities = topic.Complexities;
            }
            else
            {
                _logger.LogInformation("Adding seeded topic. TopicSlug={TopicSlug} TopicTitle={TopicTitle}", topic.Slug, topic.Title);
                await _dbContext.Topics.AddAsync(topic);
            }
        }

        private async Task SeedProblemsAsync()
        {
            if (!Directory.Exists(ProblemsSeedPath))
                return;

            var problemFiles = Directory.GetFiles(ProblemsSeedPath, "*.json", SearchOption.AllDirectories);
            foreach (var filePath in problemFiles)
            {
                using var stream = File.OpenRead(filePath);
                var problem = await JsonSerializer.DeserializeAsync<Problem>(stream,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                if (problem is not null)
                {
                    var existing = await _dbContext.Problems.FirstOrDefaultAsync(p => p.Title == problem.Title);
                    if (existing == null)
                    {
                        if (string.IsNullOrWhiteSpace(problem.Slug))
                            problem.Slug = problem.Title.ToLower().Replace(" ", "-");

                        _logger.LogInformation("Adding seeded problem. ProblemSlug={ProblemSlug} ProblemTitle={ProblemTitle}", problem.Slug, problem.Title);
                        await _dbContext.Problems.AddAsync(problem);
                    }
                }
            }
            await _dbContext.SaveChangesAsync();
        }

        private async Task SeedLearningPathsAsync()
        {
            if (_dbContext.LearningPaths.Any())
                return;

            _logger.LogInformation("Adding seeded learning paths.");
            var allProblems = await _dbContext.Problems.ToListAsync();
            var allTopics = await _dbContext.Topics.ToListAsync();

            var paths = new List<Domain.Models.LearningPathModule.LearningPath>
            {
                BuildDsaFundamentalsPath(allTopics, allProblems),
                BuildArrayMasteryPath(allTopics, allProblems),
                BuildSortingSearchingPath(allTopics)
            };

            await _dbContext.LearningPaths.AddRangeAsync(paths);
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("Added seeded learning paths. Count={LearningPathCount}", paths.Count);
        }

        private static Domain.Models.LearningPathModule.LearningPath BuildDsaFundamentalsPath(
            List<Topic> allTopics,
            List<Problem> allProblems)
        {
            var path = new Domain.Models.LearningPathModule.LearningPath
            {
                Title = "Data Structures & Algorithms",
                Slug = "dsa-fundamentals",
                Description = "Master the core data structures and algorithms from arrays to graphs.",
                Icon = "code",
                Order = 1,
                Levels = new List<Domain.Models.LearningPathModule.LearningPathLevel>()
            };

            var pairs = new List<(string Topic, string Problem)>
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
            foreach (var (topicSlug, problemSlug) in pairs)
            {
                var topic = allTopics.FirstOrDefault(t => t.Slug == topicSlug);
                if (topic != null)
                    path.Levels.Add(new Domain.Models.LearningPathModule.LearningPathLevel
                    {
                        Title = topic.Title,
                        Order = order++,
                        TopicId = topic.Id
                    });

                if (!string.IsNullOrEmpty(problemSlug))
                {
                    var problem = allProblems.FirstOrDefault(p => p.Slug == problemSlug);
                    if (problem != null)
                        path.Levels.Add(new Domain.Models.LearningPathModule.LearningPathLevel
                        {
                            Title = problem.Title,
                            Order = order++,
                            ProblemId = problem.Id
                        });
                }
            }
            return path;
        }

        private static Domain.Models.LearningPathModule.LearningPath BuildArrayMasteryPath(
            List<Topic> allTopics,
            List<Problem> allProblems)
        {
            var path = new Domain.Models.LearningPathModule.LearningPath
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
                path.Levels.Add(new Domain.Models.LearningPathModule.LearningPathLevel
                {
                    Title = "Learn Arrays",
                    Order = 1,
                    TopicId = arrayTopic.Id
                });

            var arrayProblems = allProblems.Where(p => p.Topic?.Slug == "array" || p.TopicId == (arrayTopic?.Id ?? 0)).ToList();
            int order = 2;
            foreach (var p in arrayProblems.Take(8))
                path.Levels.Add(new Domain.Models.LearningPathModule.LearningPathLevel
                {
                    Title = p.Title,
                    Order = order++,
                    ProblemId = p.Id
                });

            return path;
        }

        private static Domain.Models.LearningPathModule.LearningPath BuildSortingSearchingPath(
            List<Topic> allTopics)
        {
            var path = new Domain.Models.LearningPathModule.LearningPath
            {
                Title = "Sorting & Searching",
                Slug = "sorting-searching",
                Description = "Learn all major sorting algorithms and searching techniques.",
                Icon = "search",
                Order = 3,
                Levels = new List<Domain.Models.LearningPathModule.LearningPathLevel>()
            };

            var sortTopicSlugs = new[]
{
"bubble-sort", "selection-sort", "insertion-sort", "binary-search" };
            int order = 1;
            foreach (var slug in sortTopicSlugs)
            {
                var topic = allTopics.FirstOrDefault(t => t.Slug == slug);
                if (topic != null)
                    path.Levels.Add(new Domain.Models.LearningPathModule.LearningPathLevel
                    {
                        Title = topic.Title,
                        Order = order++,
                        TopicId = topic.Id
                    });
            }
            return path;
        }
    }
}


