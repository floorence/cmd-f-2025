import json
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

                                                                                                                                                                         

MODEL_PATH = "./saved_model"

# # Setting up S3 client
# s3 = boto3.client('s3')

# # Function to download and install dependencies from S3
# def download_and_install_dependencies(bucket, key, tmp_path):
#     s3.download_file(bucket, key, tmp_path)
#     with zipfile.ZipFile(tmp_path, 'r') as zip_ref:
#         zip_ref.extractall('/tmp')

#     # Installing the dependencies
#     subprocess.call([sys.executable, "-m", "pip", "install", "--target", "/tmp", "/tmp/transformers"])

# # Load the model and tokenizer from S3 bucket
# def load_model():
#     bucket_name = 'healthshieldbucket'
#     model_key = 'fine_tune_model.py'
#     tokenizer_key = 'tokenizer.json'

#     # Downloading the model and tokenizer files from S3 to the
#     # temporary disk space given by lambda (tmp)
#     s3.download_file(bucket_name, model_key, "/tmp/model")
#     s3.download_file(bucket_name, tokenizer_key, "/tmp/tokenizer")

#     # Loading our model
#     model =  AutoModelForSequenceClassification.from_pretrained('/tmp/model', local_files_only=True)

#     #Loading out tokenizer
#     tokenizer = AutoTokenizer.from_pretrained('/tmp/tokenizer', local_files_only=True)

#     return model, tokenizer

# download_and_install_dependencies('healthshieldbucket', 'transformers_layer.zip', '/tmp/transformers')  # Update with actual S3 key for transformers.zip

# # Initialize the model and tokenizer
# model, tokenizer = load_model()


# def lambda_handler(event, context):
#     # Extract text from the event (tweet text)
#     input_text = event['text']

#     # Tokenize the input text according to pytorch
#     inputs = tokenizer(input_text, return_tensors="pt", padding="max_length", truncation=True, max_length=512)

#     # Make a prediction
#     with torch.no_grad():
#         outputs = model(**inputs)
#         prediction = torch.argmax(outputs.logits, dim=1).item()

#     # Return the prediction (1 or 0)
#     return {
#         'statusCode': 200,
#         'body': json.dumps({'prediction': prediction})
#     }


# Load pre-trained model
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

# Initialize FastAPI
app = FastAPI()

#  Enable CORS for Frontend Requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define Input Format for API
class TextInput(BaseModel):
    text: str

@app.get("/")
def home():
    return {"message": "Server is running. Send POST request to /predict"}


#  Explicitly Handle OPTIONS Requests
@app.options("/{full_path:path}")
async def preflight(full_path: str):
    return {"message": "CORS Preflight Passed"}

@app.post("/predict")
def predict(input_data: TextInput):
    input_text = input_data.text

    # Tokenize Input
    inputs = tokenizer(input_text, return_tensors="pt", padding="max_length", truncation=True, max_length=512)

    # Make a prediction
    with torch.no_grad():
        outputs = model(**inputs)
        prediction = torch.argmax(outputs.logits, dim=1).item()

    return {"prediction": prediction}
