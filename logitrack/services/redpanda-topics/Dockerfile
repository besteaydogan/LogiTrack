FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY create_redpanda_topics.py .

CMD ["python", "create_redpanda_topics.py"]
