#!/bin/bash

echo "$CODE" | base64 -d > code.py

if [ -n "$BATCH_INPUTS" ]; then
echo "$BATCH_INPUTS" | base64 -d > batch_inputs.txt
TIME_LIMIT_SEC=$(awk "BEGIN {printf \"%.3f\", ${TIME_LIMIT_MS:-1000}/1000}")

results="["
first=1

while IFS= read -r encoded_input || [ -n "$encoded_input" ]; do
    [ -z "$encoded_input" ] && continue

    echo "$encoded_input" | base64 -d > case_input.txt

    start_ms=$(date +%s%3N)
    output=$(timeout "${TIME_LIMIT_SEC}s" python3 -u code.py < case_input.txt 2>stderr.txt)
    exit_code=$?
    end_ms=$(date +%s%3N)
    elapsed_ms=$((end_ms - start_ms))
    error=$(cat stderr.txt)

    output_b64=$(printf "%s" "$output" | base64 | tr -d '\n')
    error_b64=$(printf "%s" "$error" | base64 | tr -d '\n')

    if [ $first -eq 0 ]; then
        results="${results},"
    fi
    first=0

    results="${results}{\"outputBase64\":\"${output_b64}\",\"errorBase64\":\"${error_b64}\",\"exitCode\":${exit_code},\"executionTimeMs\":${elapsed_ms}}"
done < batch_inputs.txt

results="${results}]"
echo "$results"
else
echo "$INPUT" | base64 -d > input.txt
python3 -u code.py < input.txt
fi