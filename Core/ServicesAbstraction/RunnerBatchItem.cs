namespace ServicesAbstraction
{
    public sealed class RunnerBatchItem
    {
        public string OutputBase64
        {
            get;
            set;
        } = string.Empty;
        public string ErrorBase64
        {
            get;
            set;
        } = string.Empty;
        public int ExitCode
        {
            get;
            set;
        }
        public long ExecutionTimeMs
        {
            get;
            set;
        }
    }
}


