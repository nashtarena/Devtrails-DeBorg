FROM python:3.12-slim

WORKDIR /ml

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Train models if not already trained
RUN python data_generator.py && python premium_model.py && python claim_model.py && python fraud_model.py

EXPOSE 8001
CMD ["uvicorn", "ml_router:app", "--host", "0.0.0.0", "--port", "8001"]
