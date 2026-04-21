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

                if (!_dbContext.Categories.Any())
                {
                    var categoriesStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\categories.json");
                    var categories = await JsonSerializer.DeserializeAsync<List<Category>>(categoriesStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (categories is not null && categories.Any())
                    {
                        await _dbContext.Categories.AddRangeAsync(categories);
                    }
                }

                if (!_dbContext.Topics.Any())
                {
                    var arrayStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\array.json");
                    var arrayTopic = await JsonSerializer.DeserializeAsync<Topic>(arrayStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (arrayTopic is not null)
                    {
                        await _dbContext.Topics.AddAsync(arrayTopic);
                    }

                    var binarySearchStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\binary-search.json");
                    var binarySearchTopic = await JsonSerializer.DeserializeAsync<Topic>(binarySearchStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (binarySearchTopic is not null)
                    {
                        await _dbContext.Topics.AddAsync(binarySearchTopic);
                    }

                    var singlyLinkedListStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\linked-list.json");
                    var singlyLinkedListTopic = await JsonSerializer.DeserializeAsync<Topic>(singlyLinkedListStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (singlyLinkedListTopic is not null)
                    {
                        await _dbContext.Topics.AddAsync(singlyLinkedListTopic);
                    }

                    var bubbleSortStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\bubble-sort.json");
                    var bubbleSortTopic = await JsonSerializer.DeserializeAsync<Topic>(bubbleSortStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (bubbleSortTopic is not null)
                    {
                        await _dbContext.Topics.AddAsync(bubbleSortTopic);
                    }

                    var insertionSortStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\insertion-sort.json");
                    var insertionSortTopic = await JsonSerializer.DeserializeAsync<Topic>(insertionSortStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (insertionSortTopic is not null)
                    {
                        await _dbContext.Topics.AddAsync(insertionSortTopic);
                    }

                    var selectionSortStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\selection-sort.json");
                    var selectionSortTopic = await JsonSerializer.DeserializeAsync<Topic>(selectionSortStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (selectionSortTopic is not null)
                    {
                        await _dbContext.Topics.AddAsync(selectionSortTopic);
                    }

                    var quickSortStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\quick-sort.json");
                    var quickSortTopic = await JsonSerializer.DeserializeAsync<Topic>(quickSortStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (quickSortTopic is not null)
                    {
                        await _dbContext.Topics.AddAsync(quickSortTopic);
                    }

                    var stackStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\stack.json");
                    var stackTopic = await JsonSerializer.DeserializeAsync<Topic>(stackStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (stackTopic is not null)
                    {
                        await _dbContext.Topics.AddAsync(stackTopic);
                    }

                    var queueStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\queue.json");
                    var queueTopic = await JsonSerializer.DeserializeAsync<Topic>(queueStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (queueTopic is not null)
                    {
                        await _dbContext.Topics.AddAsync(queueTopic);
                    }

                    var binaryTreeStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\binary-tree.json");
                    var binaryTreeTopic = await JsonSerializer.DeserializeAsync<Topic>(binaryTreeStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (binaryTreeTopic is not null)
                    {
                        await _dbContext.Topics.AddAsync(binaryTreeTopic);
                    }

                    var bstStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\binary-search-tree.json");
                    var bstTopic = await JsonSerializer.DeserializeAsync<Topic>(bstStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (bstTopic is not null)
                    {
                        await _dbContext.Topics.AddAsync(bstTopic);
                    }

                    var dfsStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\dfs.json");
                    var dfsTopic = await JsonSerializer.DeserializeAsync<Topic>(dfsStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (dfsTopic is not null)
                    {
                        await _dbContext.Topics.AddAsync(dfsTopic);
                    }

                    var bfsStream = File.OpenRead(@"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Topics\bfs.json");
                    var bfsTopic = await JsonSerializer.DeserializeAsync<Topic>(bfsStream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (bfsTopic is not null)
                    {
                        await _dbContext.Topics.AddAsync(bfsTopic);
                    }

                }

                await _dbContext.SaveChangesAsync();



                if (!_dbContext.Problems.Any())
                {
                    var problemFiles = new[]
                    {
                        @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Problems\Array\count-even-numbers.json",
                        @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Problems\Array\reverse-array.json",
                        @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Problems\Array\rotate-array-left.json",
                        @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Problems\Array\second-largest-element.json",
                        @"..\Infrastructure\Persistence\Data\Seeds\DataSeedFiles\Problems\Array\sum-of-all-elements.json"
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
