package llm

import (
    "context"
    "os"

    "github.com/sashabaranov/go-openai"
)

func InvokeLLM(messages []openai.ChatCompletionMessage) (string, error) {
    client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))
    resp, err := client.CreateChatCompletion(
        context.Background(),
        openai.ChatCompletionRequest{
            Model:    openai.GPT3Dot5Turbo,
            Messages: messages,
        },
    )

    if err != nil {
        return "", err
    }

    return resp.Choices[0].Message.Content, nil
}
