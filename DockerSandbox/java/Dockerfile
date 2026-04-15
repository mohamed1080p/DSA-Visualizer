FROM eclipse-temurin:17-jdk-jammy

RUN useradd -m -u 1000 runner
WORKDIR /home/runner

COPY run.sh /home/runner/run.sh
RUN chmod +x /home/runner/run.sh && chown runner:runner /home/runner

USER runner
ENTRYPOINT ["/home/runner/run.sh"]