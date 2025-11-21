# Build stage
FROM golang:1.24-alpine AS build
RUN apk add --no-cache git
WORKDIR /src
COPY . .
RUN go mod download
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o shieldd ./cmd/shieldd

# Runtime stage
FROM scratch
COPY --from=build /src/shieldd /shieldd
COPY --from=build /src/rules /rules
ENTRYPOINT ["/shieldd"]
