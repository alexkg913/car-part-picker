import csv
import os
import hashlib
import json
import re

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

CSV_FILE_PATH = os.path.join(os.path.dirname(__file__), 'output', 'mqb_parts_combined_categorized.csv')

SERVICE_ACCOUNT_KEY_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'serviceAccountKey.json')

if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")
        print(f"Please ensure SERVICE_ACCOUNT_KEY_PATH is correct: {SERVICE_ACCOUNT_KEY_PATH}")
        print("Also verify that the service account key file exists and is valid.")
        exit(1)

db = firestore.client()

def parse_csv(file_path):
    print(f"Reading and parsing CSV file: {file_path}")
    parts_data = []
    try:
        with open(file_path, mode='r', encoding='utf-8') as csv_file:
            csv_reader = csv.DictReader(csv_file)
            line_count = 0
            for row in csv_reader:
                if line_count == 0:
                    pass
                if all(key in row and row[key] for key in ['model_designator', 'manufacturer', 'name', 'price', 'url', 'category']):
                    parts_data.append(row)
                else:
                    print(f"Skipping invalid row in CSV (missing fields): {row}")
                line_count += 1
        print(f"Finished parsing CSV. Found {len(parts_data)} valid parts.")
    except FileNotFoundError:
        print(f"Error: CSV file not found at {file_path}")
        return None
    except Exception as e:
        print(f"Error reading or parsing CSV: {e}")
        return None
    return parts_data

def delete_collection(coll_ref, batch_size):
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0

    for doc in docs:
        print(f'Deleting doc {doc.id} from collection {coll_ref.id}')
        doc.reference.delete()
        deleted = deleted + 1

    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)

def upload_to_firestore(parts):
    print(f"Starting Firestore upload for {len(parts)} parts.")

    categorized_data = {}
    for part in parts:
        category = part['category'].lower().replace(' ', '-')
        if category not in categorized_data:
            categorized_data[category] = []

        unique_id = hashlib.md5(part['url'].encode('utf-8')).hexdigest()

        price_str = part['price']
        cleaned_price_str = re.sub(r'[^\d.]', '', price_str)

        try:
            price = float(cleaned_price_str)
            if cleaned_price_str == '' or cleaned_price_str == '.':
                 price = 0.0
        except ValueError:
            price = 0.0
            print(f"Warning: Could not parse cleaned price '{cleaned_price_str}' from original '{price_str}' for part '{part['name']}'. Setting to 0.0.")


        categorized_data[category].append({
            'id': unique_id,
            'name': part['name'],
            'price': price,
            'category': category,
            'manufacturer': part['manufacturer'],
            'model_designator': part['model_designator'],
            'url': part['url'],
        })

    print('Data grouped by category for Firestore upload:', list(categorized_data.keys()))

    print("\n--- Deleting existing parts from Firestore collections ---")
    for category in categorized_data.keys():
        collection_ref = db.collection(category)
        print(f"Deleting documents from collection: {category}")
        try:
            delete_collection(collection_ref, 500)
            print(f"Finished deleting documents from collection: {category}")
        except Exception as e:
            print(f"Error deleting documents from collection {category}: {e}")
            pass


    print("\n--- Uploading new parts to Firestore collections ---")
    batch = db.batch()
    total_added = 0

    for category, parts_to_add in categorized_data.items():
        if parts_to_add:
            print(f"Adding {len(parts_to_add)} documents to collection: {category}")
            collection_ref = db.collection(category)
            for part in parts_to_add:
                doc_ref = collection_ref.document(part['id'])
                batch.set(doc_ref, part)
            total_added += len(parts_to_add)
        else:
            print(f"No parts to add for category: {category}")

    if total_added > 0:
        try:
            batch.commit()
            print(f"Firestore batch commit complete. Total documents added: {total_added}")
        except Exception as e:
            print(f"Firestore batch commit error: {e}")
            raise
    else:
        print("No new parts to add to Firestore.")

    print('Firestore upload process completed.')

if __name__ == "__main__":
    parsed_parts = parse_csv(CSV_FILE_PATH)

    if parsed_parts is not None and parsed_parts:
        try:
            upload_to_firestore(parsed_parts)
            print("CSV data successfully uploaded to Firestore.")
        except Exception as e:
            print(f"Script failed during Firestore upload: {e}")
            exit(1)
    elif parsed_parts is None:
        exit(1)
    else:
        print("No valid parts found in the CSV to upload.")

    exit(0)
