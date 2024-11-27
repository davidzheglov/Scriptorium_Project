FROM golang:1.20
WORKDIR /usr/src/app
RUN useradd -m sandboxuser
USER sandboxuser
CMD ["go", "run", "sandbox.go"]
