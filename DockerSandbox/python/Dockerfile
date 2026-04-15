FROM python:3.11-slim

RUN useradd -m -u 1000 runner
WORKDIR /home/runner

COPY run.sh /home/runner/run.sh
RUN chmod +x /home/runner/run.sh && chown runner:runner /home/runner/run.sh

USER runner
ENTRYPOINT ["/home/runner/run.sh"]