# AI Security Service - Malware Detection
FROM python:3.11-slim AS builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libopenblas-dev \
    liblapack-dev \
    gfortran \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch with CUDA support
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install AI model dependencies
RUN pip install \
    transformers==4.35.0 \
    accelerate==0.24.0 \
    bitsandbytes==0.41.0 \
    safetensors==0.4.0 \
    onnx==1.14.1 \
    onnxruntime==1.15.1 \
    scikit-learn==1.3.0 \
    numpy==1.24.3 \
    pandas==2.0.3 \
    requests==2.31.0 \
    aiofiles==23.2.0 \
    fastapi==0.103.0 \
    uvicorn[standard]==0.23.0 \
    pydantic==2.4.0

# Working directory
WORKDIR /app

# Copy AI security service code
COPY deployment/ai-security/ /app/
RUN chmod +x /app/ai_security_service.py

# Create security logging directory
RUN mkdir -p /var/log/security /models

# Download quantized Phi-3 model (placeholder - in production this would be pre-loaded)
RUN curl -L "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf" \
    -o /models/phi-3-quantized.gguf || echo "Model download failed - using placeholder"

# Download LLaMA 3.2 1B model (placeholder)
RUN curl -L "https://huggingface.co/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-q4.gguf" \
    -o /models/llama-3.2-1b-quantized.gguf || echo "Model download failed - using placeholder"

# Security hardening
RUN chmod 750 /var/log/security /models

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python /app/health_check.py

# Start service
CMD ["python", "/app/ai_security_service.py"]