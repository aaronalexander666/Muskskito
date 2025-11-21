package scanner

import (
    "os"

    "github.com/williballenthin/govt"
)

type ThreatDetails struct {
    Type        string `json:"type"`
    Description string `json:"description"`
    Confidence  string `json:"confidence"`
}

func ScanURL(url string) (string, *ThreatDetails) {
    apiKey := os.Getenv("VIRUSTOTAL_API_KEY")
    client, err := govt.New(govt.SetApikey(apiKey))
    if err != nil {
        return "safe", nil
    }

    _, err = client.ScanUrl(url)
    if err != nil {
        return "safe", nil
    }

    report, err := client.GetUrlReport(url)
    if err != nil {
        return "safe", nil
    }

    if report.ResponseCode != 1 {
        return "safe", nil
    }

    if report.Positives > 0 {
        return "danger", &ThreatDetails{
            Type:        "Potential Malware Detected",
            Description: "This URL has been flagged as malicious by VirusTotal.",
            Confidence:  "100%",
        }
    }

    return "safe", nil
}
