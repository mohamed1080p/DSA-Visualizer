FROM gcc:latest

RUN useradd -m -u 1000 runner
WORKDIR /workspace
RUN chown runner:runner /workspace

COPY run.sh /run.sh
RUN chmod +x /run.sh

USER runner

CMD ["/run.sh"]
