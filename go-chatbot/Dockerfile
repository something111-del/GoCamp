FROM golang:1.21
WORKDIR /app
COPY go.mod ./
# Create a dummy go.sum to avoid build errors if it doesn't exist yet, 
# though 'go mod download' usually handles it. 
# Better to run 'go mod tidy' inside the container or copy it if it existed.
# For now, we'll just copy everything and build.
COPY . .
RUN go mod tidy
RUN go build -o chatbot main.go
EXPOSE 8080
CMD ["./chatbot"]
