FROM golang:alpine AS build
RUN apk --no-cache add gcc g++ make git
WORKDIR /go/src/thump/server-go
COPY . .
RUN go get ./...
RUN GOOS=linux go install -ldflags="-s -w" ./thump

FROM alpine:3.9
RUN apk --no-cache add ca-certificates
WORKDIR /usr/bin
COPY --from=build /go/bin/thump /go/bin/thump
EXPOSE 80
ENTRYPOINT /go/bin/thump --port 80
