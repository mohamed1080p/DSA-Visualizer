using Domain.Contracts;
using Domain.Models.LearningPathModule;
using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using Shared.DTOs.LearningPathDTOs;

namespace Services.Learning
{
    public class LearningPathService(IUnitOfWork _unitOfWork, ILogger<LearningPathService> _logger) : ILearningPathService
    {
        public async Task<IEnumerable<LearningPathDTO>> GetAllAsync(string? userId)
        {
            var paths = await _unitOfWork.GetRepository<LearningPath, int>()
                .GetAllReadOnlyAsync(predicate: null, orderBy: q => q.OrderBy(p => p.Order), includes: p => p.Levels);

            var userProgresses = new List<UserLearningPathProgress>();
            if (!string.IsNullOrEmpty(userId))
            {
                userProgresses = (await _unitOfWork.GetRepository<UserLearningPathProgress, int>()
                    .GetAllReadOnlyAsync(predicate: p => p.UserId == userId, orderBy: null))
                    .ToList();
            }

            return paths.Select(p =>
            {
                var progress = userProgresses.FirstOrDefault(up => up.LearningPathId == p.Id);
                return new LearningPathDTO
                {
                    Id = p.Id,
                    Title = p.Title,
                    Slug = p.Slug,
                    Description = p.Description,
                    Icon = p.Icon,
                    TotalLevels = p.Levels.Count,
                    CompletedLevels = progress?.CurrentLevelOrder ?? 0,
                    IsStarted = progress != null
                };
            });
        }
        public async Task<LearningPathDetailDTO> GetBySlugAsync(string slug, string? userId)
        {
            var allPaths = await _unitOfWork.GetRepository<LearningPath, int>()
                .GetAllReadOnlyAsync(predicate: p => p.Slug == slug, orderBy: null, includes: p => p.Levels);
            var path = allPaths.FirstOrDefault()
                ?? throw new KeyNotFoundException($"Learning path '{slug}' not found.");
            // Load problem/topic details for each level
            var levels = path.Levels.OrderBy(l => l.Order).ToList();
            var problemIds = levels.Where(l => l.ProblemId.HasValue).Select(l => l.ProblemId!.Value).ToList();
            var topicIds = levels.Where(l => l.TopicId.HasValue).Select(l => l.TopicId!.Value).ToList();

            var problems = problemIds.Any()
                ? (await _unitOfWork.GetRepository<Problem, int>()
                    .GetAllReadOnlyAsync(predicate: p => problemIds.Contains(p.Id), orderBy: null)).ToList()
                : new List<Problem>();

            var topics = topicIds.Any()
                ? (await _unitOfWork.GetRepository<Topic, int>()
                    .GetAllReadOnlyAsync(predicate: t => topicIds.Contains(t.Id), orderBy: null)).ToList()
                : new List<Topic>();

            UserLearningPathProgress? progress = null;
            if (!string.IsNullOrEmpty(userId))
            {
                var progresses = await _unitOfWork.GetRepository<UserLearningPathProgress, int>()
                    .GetAllReadOnlyAsync(predicate: p => p.UserId == userId && p.LearningPathId == path.Id, orderBy: null);
                progress = progresses.FirstOrDefault();
            }

            int completedLevels = progress?.CurrentLevelOrder ?? 0;

            return new LearningPathDetailDTO
            {
                Id = path.Id,
                Title = path.Title,
                Slug = path.Slug,
                Description = path.Description,
                TotalLevels = levels.Count,
                CompletedLevels = completedLevels,
                IsStarted = progress != null,
                Levels = levels.Select(l =>
                {
                    var problem = l.ProblemId.HasValue ? problems.FirstOrDefault(p => p.Id == l.ProblemId) : null;
                    var topic = l.TopicId.HasValue ? topics.FirstOrDefault(t => t.Id == l.TopicId) : null;
                    return new LearningPathLevelDTO
                    {
                        Id = l.Id,
                        Title = l.Title,
                        Order = l.Order,
                        Type = l.ProblemId.HasValue ? "problem" : "topic",
                        Slug = problem?.Slug ?? topic?.Slug,
                        Difficulty = problem?.Difficulty.ToString(),
                        IsCompleted = l.Order <= completedLevels,
                        IsLocked = l.Order > completedLevels + 1
                    };
                }).ToList()
            };
        }
        public async Task StartPathAsync(string slug, string userId)
        {
            var allPaths = await _unitOfWork.GetRepository<LearningPath, int>()
                .GetAllAsync(predicate: p => p.Slug == slug, orderBy: null);
            var path = allPaths.FirstOrDefault()
                ?? throw new KeyNotFoundException($"Learning path '{slug}' not found.");

            var existing = (await _unitOfWork.GetRepository<UserLearningPathProgress, int>()
                .GetAllAsync(predicate: p => p.UserId == userId && p.LearningPathId == path.Id, orderBy: null))
                .FirstOrDefault();

            if (existing != null) return;

            var repo = _unitOfWork.GetRepository<UserLearningPathProgress, int>();
            await repo.AddAsync(new UserLearningPathProgress
            {
                UserId = userId,
                LearningPathId = path.Id,
                CurrentLevelOrder = 0,
                StartedAt = DateTime.UtcNow
            });
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task CompleteLevelAsync(string slug, int levelOrder, string userId)
        {
            var allPaths = await _unitOfWork.GetRepository<LearningPath, int>()
                .GetAllAsync(predicate: p => p.Slug == slug, orderBy: null, includes: p => p.Levels);
            var path = allPaths.FirstOrDefault()
                ?? throw new KeyNotFoundException($"Learning path '{slug}' not found.");

            var progress = (await _unitOfWork.GetRepository<UserLearningPathProgress, int>()
                .GetAllAsync(predicate: p => p.UserId == userId && p.LearningPathId == path.Id, orderBy: null))
                .FirstOrDefault()
                ?? throw new InvalidOperationException("You must start this path first.");

            if (levelOrder <= progress.CurrentLevelOrder) return;
            if (levelOrder > progress.CurrentLevelOrder + 1)
                throw new InvalidOperationException("You must complete previous levels first.");

            progress.CurrentLevelOrder = levelOrder;
            if (levelOrder >= path.Levels.Count)
            {
                progress.IsCompleted = true;
                progress.CompletedAt = DateTime.UtcNow;
            }

            _unitOfWork.GetRepository<UserLearningPathProgress, int>().Update(progress);
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task AdvanceIfCurrentLevelMatchesAsync(string userId, int? topicId = null, int? problemId = null)
        {
            if (topicId == null && problemId == null) return;

            _logger.LogInformation(
                "Evaluating learning path auto-advance. UserId={UserId} TopicId={TopicId} ProblemId={ProblemId}",
                userId,
                topicId,
                problemId);

            var activeProgresses = await _unitOfWork.GetRepository<UserLearningPathProgress, int>()
                .GetAllAsync(
                    predicate: p => p.UserId == userId && !p.IsCompleted,
                    orderBy: null,
                    includes: p => p.LearningPath.Levels);

            var activeProgressList = activeProgresses.ToList();
            _logger.LogDebug(
                "Found active learning path progresses. UserId={UserId} ActiveProgressCount={ActiveProgressCount}",
                userId,
                activeProgressList.Count);

            foreach (var progress in activeProgressList)
            {
                var path = progress.LearningPath;
                if (path == null) continue;

                var nextLevelOrder = progress.CurrentLevelOrder + 1;
                var nextLevel = path.Levels.FirstOrDefault(l => l.Order == nextLevelOrder);

                if (nextLevel != null)
                {
                    bool match = false;
                    if (topicId.HasValue && nextLevel.TopicId == topicId.Value) match = true;
                    if (problemId.HasValue && nextLevel.ProblemId == problemId.Value) match = true;

                    if (match)
                    {
                        progress.CurrentLevelOrder = nextLevelOrder;
                        if (nextLevelOrder >= path.Levels.Count)
                        {
                            progress.IsCompleted = true;
                            progress.CompletedAt = DateTime.UtcNow;
                        }

                        _logger.LogInformation(
                            "Learning path progressed. UserId={UserId} LearningPathSlug={LearningPathSlug} NewLevelOrder={NewLevelOrder}",
                            userId,
                            path.Slug,
                            nextLevelOrder);

                        _unitOfWork.GetRepository<UserLearningPathProgress, int>().Update(progress);
                    }
                }
            }

            await _unitOfWork.SaveChangesAsync();
        }
    }
}




