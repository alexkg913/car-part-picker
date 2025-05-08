import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import csv from 'csv-parser';
import { db } from '@/lib/firebase/firebase-admin';
import * as admin from 'firebase-admin';

interface CsvPart {
  model_designator: string;
  manufacturer: string;
  name: string;
  price: string;
  url: string;
  category: string;
}

const KNOWN_CATEGORIES = [
    'intakes',
    'suspension-parts',
    'brake-parts',
    'wheels',
    'tunes',
    'turbochargers',
    'engine-build-parts',
    'exhaust-systems',
    'downpipes',
    'miscellaneous'
];


export async function POST(request: Request) {
  try {
    console.log('Starting parts refresh process...');

    const scriptPath = path.join(process.cwd(), 'partsScrape.py');
    console.log(`Executing Python script: ${scriptPath}`);

    await new Promise<void>((resolve, reject) => {
      exec(`python ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return reject(new Error(`Failed to execute Python script: ${error.message}`));
        }
        if (stderr) {
          console.warn(`Python script stderr: ${stderr}`);
        }
        console.log(`Python script stdout: ${stdout}`);
        resolve();
      });
    });

    console.log('Python script executed successfully.');

    const outputDir = path.join(process.cwd(), 'output');
    const csvFileName = 'mqb_parts_combined_categorized.csv';
    const csvFilePath = path.join(outputDir, csvFileName);

    console.log(`Reading CSV from: ${csvFilePath}`);

    const results: CsvPart[] = [];
    let fileContent: string;
    try {
        fileContent = await fs.readFile(csvFilePath, 'utf-8');
    } catch (readError: any) {
        console.error('Error reading CSV file:', readError);
        throw new Error(`Failed to read CSV file: ${readError.message}`);
    }


    await new Promise<void>((resolve, reject) => {
      const { Readable } = require('stream');
      Readable.from(fileContent)
        .pipe(csv())
        .on('data', (data: any) => {
            if (data.model_designator && data.manufacturer && data.name && data.price && data.url && data.category) {
                 results.push(data as CsvPart);
            } else {
                 console.warn(`Skipping invalid row in CSV (missing fields): ${JSON.stringify(data)}`);
            }
        })
        .on('end', () => {
          console.log(`Finished parsing CSV. Found ${results.length} valid parts.`);
          resolve();
        })
        .on('error', (err: any) => {
          console.error('CSV parsing stream error:', err);
          reject(new Error(`Failed to parse CSV file stream: ${err.message}`));
        });
    });

    const categorizedFirestoreData: { [category: string]: any[] } = {};

    results.forEach(part => {
        const category = part.category.toLowerCase().replace(/\s+/g, '-');
        if (categorizedFirestoreData[category]) {
            categorizedFirestoreData[category] = [];
        }
        categorizedFirestoreData[category].push({
            id: require('crypto').createHash('md5').update(part.url).digest('hex'),
            name: part.name,
            price: parseFloat(part.price) || 0,
            category: category,
            manufacturer: part.manufacturer,
            model_designator: part.model_designator,
            url: part.url,
        });
    });

    console.log('Data grouped by category for Firestore:', Object.keys(categorizedFirestoreData));

    const batch = db.batch();

    console.log('Deleting existing parts from known Firestore collections...');
    for (const category of KNOWN_CATEGORIES) {
        try {
            const collectionRef = db.collection(category);
            const existingDocsSnapshot = await collectionRef.get();
            if (existingDocsSnapshot.empty) {
                 console.log(`Deleting ${existingDocsSnapshot.size} documents from collection: ${category}`);
                 existingDocsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            } else {
                 console.log(`No documents to delete in collection: ${category}`);
            }
        } catch (deleteError: any) {
            console.warn(`Error deleting documents from collection ${category}: ${deleteError.message}`);
        }
    }

    console.log('Adding new parts to Firestore collections...');
    let totalAdded = 0;
    for (const category in categorizedFirestoreData) {
        const partsToAdd = categorizedFirestoreData[category];
        if (partsToAdd.length > 0) {
             console.log(`Adding ${partsToAdd.length} documents to collection: ${category}`);
             const collectionRef = db.collection(category);
             partsToAdd.forEach(part => {
                const docRef = collectionRef.doc(part.id);
                batch.set(docRef, part);
             });
             totalAdded += partsToAdd.length;
        } else {
             console.log(`No parts to add for category: ${category}`);
        }
    }

    try {
        await batch.commit();
        console.log('Firestore batch commit complete.');
    } catch (commitError: any) {
        console.error('Firestore batch commit error:', commitError);
        throw new Error(`Failed to commit Firestore batch: ${commitError.message}`);
    }

    console.log('Parts refresh process completed successfully.');

    return NextResponse.json({
      success: true,
      message: 'Parts list refreshed successfully from CSV and uploaded to Firestore.',
      uploadedCount: totalAdded,
    });

  } catch (error: any) {
    console.error('Refresh failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to refresh parts list.',
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
}
