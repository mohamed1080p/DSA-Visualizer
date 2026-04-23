using Domain.Contracts;
using Domain.Models.TopicModule;
using ServicesAbstraction;
using Shared.DTOs.TopicsDTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services
{
    public class TopicService(IUnitOfWork _unitOfWork) : ITopicService
    {
        public async Task<IEnumerable<TopicDTO>> GetAllAsync()
        {
            var topics = await _unitOfWork.GetRepository<Topic, int>().
                GetAllAsync(predicate: null, orderBy: null, includes: a => a.Category);
            return topics.Select(t => new TopicDTO()
            {
                Id = t.Id,
                CategoryName = t.Category.Name,
                Description = t.Description,
                Difficulty = t.Difficulty.ToString(),
                Slug = t.Slug,
                Title = t.Title
            });
        }

        public async Task<IEnumerable<TopicDTO>> GetAllAsync(TopicQueryParametersDTO parameters)
        {
            var topics = await _unitOfWork.GetRepository<Topic, int>().GetAllAsync(
            predicate: t =>
            (string.IsNullOrEmpty(parameters.SearchTerm) || t.Title.Contains(parameters.SearchTerm)) &&
            (string.IsNullOrEmpty(parameters.Difficulty) || t.Difficulty == Enum.Parse<DifficultyLevel>(parameters.Difficulty, ignoreCase: true)) &&
            (parameters.CategoryId == null || t.CategoryId == parameters.CategoryId),
            orderBy: null,
            includes: t => t.Category);

            return topics.Select(t => new TopicDTO()
            {
                Id = t.Id,
                CategoryName = t.Category.Name,
                Description = t.Description,
                Difficulty = t.Difficulty.ToString(),
                Slug = t.Slug,
                Title = t.Title
            });
        }

        public async Task<TopicDetailDTO> GetBySlugAsync(string slug)
        {
            var topics = await _unitOfWork.GetRepository<Topic, int>().GetAllAsync(
                predicate: t => t.Slug == slug,
                orderBy: null,
                t => t.Category,
                t => t.Complexities,
                t => t.CodeImplementations);

            var topic = topics.FirstOrDefault();

            if(topic is null)
            {
                throw new Exception($"Topic with Slug: '{slug}' was not found");
            }
            return new TopicDetailDTO
            {
                Id = topic.Id,
                Title = topic.Title,
                Description = topic.Description,
                Slug = topic.Slug,
                Explanation = topic.Explanation,
                Difficulty = topic.Difficulty.ToString(),
                CategoryName = topic.Category.Name,
                Complexities = topic.Complexities.Select(c => new TopicComplexityDTO
                {
                    OperationName = c.OperationName,
                    TimeComplexity = c.TimeComplexity,
                    SpaceComplexity = c.SpaceComplexity
                }),
                CodeImplementations = topic.CodeImplementations.Select(c => new TopicCodeImplementationDTO
                {
                    Language = c.Language.ToString(),
                    Code = c.Code,
                    StepsJson = c.StepsJson
                })
            };

        }

        public async Task MarkTopicAsCompletedAsync(string slug, string userId)
        {
            var topics = await _unitOfWork.GetRepository<Topic, int>().GetAllAsync(
                predicate: t => t.Slug == slug,
                orderBy: null);
            var topic = topics.FirstOrDefault();

            if (topic is null)
                throw new Exception($"Topic with Slug: '{slug}' was not found");

            var progress = await _unitOfWork.GetRepository<UserTopicProgress, int>().
                GetAllAsync(predicate: p => p.UserId == userId && p.TopicId == topic.Id, orderBy: null);

            var existingProgress = progress.FirstOrDefault();
            if(existingProgress is null)
            {
                await _unitOfWork.GetRepository<UserTopicProgress, int>().AddAsync(new UserTopicProgress()
                {
                    TopicId = topic.Id,
                    UserId = userId,
                    IsCompleted = true,
                    CompletedAt = DateTime.UtcNow,
                });
            }
            else
            {
                existingProgress.IsCompleted = true;
                existingProgress.CompletedAt = DateTime.UtcNow;
                _unitOfWork.GetRepository<UserTopicProgress, int>().Update(existingProgress);
            }
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
