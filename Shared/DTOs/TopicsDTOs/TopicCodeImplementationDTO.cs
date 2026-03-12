using System;
using System.Collections.Generic;
using System.Text;

namespace Shared.DTOs.TopicsDTOs
{
    public class TopicCodeImplementationDTO
    {
        public string Language { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string StepsJson { get; set; } = "[]";
    }
}
